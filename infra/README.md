# BDGT Infrastructure

## Architecture

```
                          ┌─────────────────────────────────────────────────┐
                          │  EC2 t3.micro  (eu-central-1a)                  │
  Internet                │                                                  │
  :80 / :443  ──────────► │  ┌──────────┐    ┌─────────────────────────┐   │
                          │  │  nginx   │───►│  web (Next.js :3000)    │   │
  :22 (your IP + CI) ──► │  └──────────┘    └────────────┬────────────┘   │
                          │                               │                  │
                          │                  ┌────────────▼────────────┐   │
                          │                  │  db (Postgres :5432)    │   │
                          │                  └────────────┬────────────┘   │
                          │                               │                  │
                          │                  ┌────────────▼────────────┐   │
                          │                  │  EBS 20 GB (/data/postgres) │ │
                          └──────────────────┴─────────────────────────────┘
```

**Stack:**
- **EC2 t3.micro** — Amazon Linux 2023, single instance, public subnet
- **nginx** — reverse proxy on ports 80/443; optional HTTPS via Let's Encrypt
- **web** — Next.js 16 standalone image (frontend + API routes)
- **migrate** — one-shot Prisma migration runner, exits after deploy
- **db** — Postgres 16, data persisted on a dedicated EBS volume
- **ECR** — two private repositories: `bdgt-web`, `bdgt-migrate`
- **GitHub Actions** — builds images on push to `master`, deploys to EC2 via SSH; runner IP is dynamically whitelisted for the duration of the deploy then revoked

**Secrets flow (Option B):** All secrets live in GitHub Secrets. On every deploy the Actions workflow writes a fresh `.env` to the EC2 instance. No secrets in Terraform state or git.

---

## One-time setup

### 1. Prerequisites

- AWS CLI configured (`aws configure`)
- Terraform ≥ 1.6 installed
- An AWS key pair named in `terraform.tfvars` (create in EC2 → Key Pairs)

### 2. Fill in `terraform.tfvars`

Copy the example and set every value:

```bash
cp infra/terraform/terraform.tfvars.example infra/terraform/terraform.tfvars
```

```hcl
ec2_key_pair_name  = "bdgt-keypair"          # must already exist in AWS Console
db_password        = "..."                    # min 8 chars
jwt_access_secret  = "..."                    # min 32 chars
jwt_refresh_secret = "..."                    # min 32 chars
your_ip_cidr       = "203.0.113.1/32"        # your public IP — find it at checkip.amazonaws.com
github_repo        = "YourOrg/BDGT"          # "owner/repo" — scopes the OIDC trust
```

### 3. Apply Terraform

```bash
cd infra/terraform
terraform init
terraform apply
```

Note the outputs — you will need them in step 5:

```
ecr_web_url             = "123456789.dkr.ecr.eu-central-1.amazonaws.com/bdgt-web"
ecr_migrate_url         = "123456789.dkr.ecr.eu-central-1.amazonaws.com/bdgt-migrate"
github_actions_role_arn = "arn:aws:iam::123456789:role/bdgt-github-actions"
ec2_public_ip           = "1.2.3.4"
ssh_command             = "ssh -i ~/.ssh/bdgt-keypair.pem ec2-user@1.2.3.4"
```

### 4. Add `terraform.tfvars.example` entry for `github_repo`

Make sure the example file documents the new variable so future contributors know to set it.

### 5. Configure GitHub repository settings

Go to your repo → **Settings**.

**Secrets** (`Settings → Secrets and variables → Actions → Secrets`):

| Name | Value |
|---|---|
| `EC2_SSH_KEY` | Content of your `.pem` private key file |
| `DB_PASSWORD` | Same value as in `terraform.tfvars` |
| `JWT_ACCESS_SECRET` | Same value as in `terraform.tfvars` |
| `JWT_REFRESH_SECRET` | Same value as in `terraform.tfvars` |

**Variables** (`Settings → Secrets and variables → Actions → Variables`):

| Name | Value |
|---|---|
| `AWS_ROLE_ARN` | `github_actions_role_arn` from Terraform output |
| `AWS_REGION` | `eu-central-1` |

> `EC2_HOST` is no longer needed — the deploy workflow looks up the instance dynamically by the `bdgt-app` tag.

### 6. First deploy

Push to `main` (or trigger manually via **Actions → Deploy → Run workflow**).

The workflow will:
1. Build and push both Docker images to ECR
2. Look up the EC2 instance by tag and temporarily whitelist the runner IP in the security group
3. SCP the compose + nginx config to the EC2
4. Write `.env` with all secrets
5. Pull images and start containers
6. Revoke the runner IP from the security group

After ~5 minutes, the app is live at `http://<ec2-public-ip>`.

---

## Enabling HTTPS

Once you have a domain pointing to the EC2 IP:

```bash
# SSH to the instance
ssh -i ~/.ssh/bdgt-keypair.pem ec2-user@<ec2-ip>

# Install Certbot
sudo dnf install -y certbot

# Obtain certificate (nginx must be running and port 80 must be accessible)
sudo certbot certonly --webroot \
  -w /var/www/certbot \
  -d your-domain.com \
  --email you@example.com \
  --agree-tos --no-eff-email

# Edit nginx config: uncomment the HTTPS server block and fill in your domain
vi ~/bdgt/nginx.prod.conf

# Reload nginx
docker compose -f ~/bdgt/docker-compose.prod.yml restart nginx
```

For auto-renewal, add a cron job:

```bash
echo "0 3 * * * certbot renew --quiet && docker compose -f /home/ec2-user/bdgt/docker-compose.prod.yml restart nginx" \
  | sudo crontab -
```

---

## Day-to-day operations

```bash
# SSH to the instance
ssh -i ~/.ssh/bdgt-keypair.pem ec2-user@<ec2-ip>

# Check running services
docker compose -f ~/bdgt/docker-compose.prod.yml ps

# Tail logs
docker compose -f ~/bdgt/docker-compose.prod.yml logs -f web
docker compose -f ~/bdgt/docker-compose.prod.yml logs migrate

# Restart a single service
docker compose -f ~/bdgt/docker-compose.prod.yml restart web

# Run a one-off command (e.g. db seed)
docker compose -f ~/bdgt/docker-compose.prod.yml run --rm migrate \
  node_modules/.bin/prisma db seed --schema packages/database/prisma/schema.prisma
```

---

## Rotating secrets

1. Update the value in GitHub Secrets (Settings → Secrets)
2. Push an empty commit or trigger the workflow manually — the next deploy rewrites `.env`

No SSH access required for secret rotation.

---

## Troubleshooting

### Common operations

#### SSH into the instance

```bash
ssh -i ~/.ssh/bdgt-keypair.pem ec2-user@<ec2-ip>
```

Get the current public IP:
```bash
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=bdgt-app" "Name=instance-state-name,Values=running" \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text
```

#### Check container status

```bash
docker compose -f ~/bdgt/docker-compose.prod.yml ps
```

Expected healthy state:

| Container | Status |
|---|---|
| `bdgt-db-1` | `running (healthy)` |
| `bdgt-migrate-1` | `exited (0)` |
| `bdgt-web-1` | `running` |
| `bdgt-nginx-1` | `running` |

#### Tail logs

```bash
# Next.js app
docker compose -f ~/bdgt/docker-compose.prod.yml logs -f web

# Migration output (one-shot — use logs, not -f)
docker compose -f ~/bdgt/docker-compose.prod.yml logs migrate

# nginx access/error log
docker compose -f ~/bdgt/docker-compose.prod.yml logs -f nginx

# Postgres
docker compose -f ~/bdgt/docker-compose.prod.yml logs -f db
```

#### Test HTTP connectivity

```bash
# From your local machine
curl -I http://<ec2-public-ip>

# From inside the EC2 (bypasses security group)
curl -I http://localhost
```

#### Restart a single service

```bash
docker compose -f ~/bdgt/docker-compose.prod.yml restart web
```

#### Re-run migrations manually

```bash
docker compose -f ~/bdgt/docker-compose.prod.yml run --rm migrate
```

#### Verify EBS data volume is mounted

```bash
df -h /data/postgres
ls -la /data/postgres/pgdata
```

---

### Known issues and fixes

#### Postgres container unhealthy — `lost+found` in data directory

**Symptom:** `dependency failed to start: container bdgt-db-1 is unhealthy`

**Cause:** The EBS volume is formatted with ext4, which creates a `lost+found` directory at the mount root (`/data/postgres`). Postgres's `initdb` refuses to initialise a directory that is a direct mount point.

**Fix:** Postgres data lives in a subdirectory (`/data/postgres/pgdata`) rather than at the mount root. If you hit this on an existing instance where the wrong path was used:

```bash
sudo mkdir -p /data/postgres/pgdata
sudo chown 999:999 /data/postgres/pgdata
sed -i 's|/data/postgres:/var/lib/postgresql/data|/data/postgres/pgdata:/var/lib/postgresql/data|' ~/bdgt/docker-compose.prod.yml
docker compose -f ~/bdgt/docker-compose.prod.yml down
docker compose -f ~/bdgt/docker-compose.prod.yml up -d
```

---

#### Migrate container exits with `MODULE_NOT_FOUND` for prisma

**Symptom:** `Error: Cannot find module '/app/node_modules/.bin/prisma'`

**Cause:** In a pnpm workspace, the `prisma` CLI binary lives in the workspace package's own `node_modules` (`packages/database/node_modules/.bin/prisma`), not at the monorepo root. The migrator Docker image was only copying the root `node_modules`.

**Fix:** Already resolved in the Dockerfile — the migrator stage now copies `packages/database/node_modules` and uses the correct binary path.

---

#### Migrate container exits with `datasource.url property is required`

**Symptom:** `Error: The datasource.url property is required in your Prisma config file when using prisma migrate deploy.`

**Cause:** Prisma 7 reads datasource config from `prisma.config.ts`, not from the schema. The migrator image was not copying that file, so the CLI had no URL.

**Fix:** Already resolved — the migrator stage now copies `packages/database/prisma.config.ts` and passes `--config packages/database/prisma.config.ts` to the CLI.

---

#### GitHub Actions SSH timeout

**Symptom:** `dial tcp <ec2-ip>:22: i/o timeout` in the deploy workflow.

**Cause:** The EC2 security group restricts SSH to a static IP. GitHub Actions runners use dynamic IPs that are not whitelisted.

**Fix:** Already resolved — the deploy workflow dynamically whitelists the runner IP before the SSH steps and revokes it afterwards (`Whitelist runner IP for SSH` / `Revoke runner SSH access` steps).

---

#### Terraform apply fails — root volume too small

**Symptom:** `Volume of size 20GB is smaller than snapshot, expect size >= 30GB`

**Cause:** The latest Amazon Linux 2023 AMI snapshot requires a minimum 30 GB root volume.

**Fix:** Already resolved — `ec2.tf` sets `volume_size = 30`.

---

#### UnauthorizedOperation: ec2:DescribeInstances

**Symptom:** `is not authorized to perform: ec2:DescribeInstances` in the `Get EC2 host` workflow step.

**Cause:** The GitHub Actions IAM role was missing `ec2:DescribeInstances` (required to look up the EC2 instance by tag).

**Fix:** Already resolved — `iam.tf` includes `ec2:DescribeInstances` in the `github_actions_sg` policy.

---

## Remote Terraform state (optional but recommended)

Uncomment the `backend "s3"` block in `infra/terraform/main.tf` after creating:

```bash
aws s3 mb s3://bdgt-terraform-state --region eu-central-1
aws dynamodb create-table \
  --table-name bdgt-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region eu-central-1
```
