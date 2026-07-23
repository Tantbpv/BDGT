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
