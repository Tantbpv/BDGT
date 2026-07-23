# ── AMI: latest Amazon Linux 2023 ────────────────────────────────────────────

data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "state"
    values = ["available"]
  }
}

# ── EBS data volume (Postgres data) ──────────────────────────────────────────

resource "aws_ebs_volume" "data" {
  availability_zone = "${var.aws_region}a" # must match EC2's subnet AZ
  size              = var.ebs_data_volume_size
  type              = "gp3"
  encrypted         = true

  tags = {
    Name = "bdgt-data"
  }
}

resource "aws_volume_attachment" "data" {
  device_name  = "/dev/xvdf"
  volume_id    = aws_ebs_volume.data.id
  instance_id  = aws_instance.app.id
  force_detach = false
}

# ── Elastic IP ───────────────────────────────────────────────────────────────

resource "aws_eip" "app" {
  instance = aws_instance.app.id
  domain   = "vpc"

  tags = {
    Name = "bdgt-eip"
  }
}

# ── EC2 Instance ──────────────────────────────────────────────────────────────

resource "aws_instance" "app" {
  ami                    = data.aws_ami.amazon_linux_2023.id
  instance_type          = var.ec2_instance_type
  key_name               = var.ec2_key_pair_name
  subnet_id              = aws_subnet.public_a.id
  vpc_security_group_ids = [aws_security_group.ec2.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2.name

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 30
    delete_on_termination = true
    encrypted             = true
  }

  # Runs once on first boot: installs Docker, mounts the EBS data volume,
  # and writes the app .env file. The app container is started separately.
  user_data = <<-EOF
    #!/bin/bash
    set -euo pipefail

    # ── Docker ────────────────────────────────────────────────────────────────
    dnf update -y
    dnf install -y docker

    systemctl start docker
    systemctl enable docker
    usermod -aG docker ec2-user

    # Docker Compose v2 CLI plugin
    mkdir -p /usr/local/lib/docker/cli-plugins
    curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
      -o /usr/local/lib/docker/cli-plugins/docker-compose
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

    # ── EBS data volume ───────────────────────────────────────────────────────
    # On t3 instances AWS presents the attached volume as an NVMe device.
    # The kernel maps /dev/xvdf → /dev/nvme1n1, but the actual name can vary.
    # Poll both names until one appears (volume attach is asynchronous).
    DATA_DEVICE=""
    for i in $(seq 1 30); do
      for dev in /dev/nvme1n1 /dev/xvdf; do
        if [ -b "$dev" ]; then DATA_DEVICE="$dev"; break 2; fi
      done
      sleep 2
    done

    if [ -z "$DATA_DEVICE" ]; then
      echo "ERROR: data EBS volume not found after 60s" >&2
      exit 1
    fi

    # Format only if no filesystem present (safe on re-attach of existing volume)
    if ! blkid "$DATA_DEVICE" > /dev/null 2>&1; then
      mkfs -t ext4 "$DATA_DEVICE"
    fi

    mkdir -p /data/postgres
    mount "$DATA_DEVICE" /data/postgres

    # Persist mount across reboots; nofail prevents boot hang if volume is absent
    echo "$DATA_DEVICE /data/postgres ext4 defaults,nofail 0 2" >> /etc/fstab

    # Use a subdirectory so lost+found (created by mkfs) doesn't block postgres initdb.
    # UID 999 = postgres user inside the official postgres Docker image.
    mkdir -p /data/postgres/pgdata
    chown 999:999 /data/postgres/pgdata

    # ── App directory ─────────────────────────────────────────────────────────
    # .env and compose files are written by GitHub Actions on first deploy.
    mkdir -p /home/ec2-user/bdgt
    chown ec2-user:ec2-user /home/ec2-user/bdgt
  EOF

  tags = {
    Name = "bdgt-app"
  }
}
