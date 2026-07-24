# BDGT

Personal finance budgeting app. Built with Next.js 16, Prisma, PostgreSQL, deployed on AWS EC2 behind nginx.

## Stack

- **Frontend/API**: Next.js 16 App Router (`apps/web`)
- **Database**: PostgreSQL 16 via Prisma 7
- **Auth**: JWT (access + refresh tokens) via `jose`
- **Infrastructure**: AWS EC2 + ECR + Terraform, Docker Compose, GitHub Actions CI/CD

## Local development

```bash
cp .env.example .env        # fill in secrets
pnpm install
pnpm db:up                  # start PostgreSQL + pgAdmin via Docker
pnpm db:migrate             # run Prisma migrations
pnpm dev                    # start Next.js dev server on :3000
```

pgAdmin is available at http://localhost:5050 (admin@bdgt.dev / admin).

## Key commands

```bash
pnpm build          # build all packages
pnpm lint           # ESLint
pnpm type-check     # tsc --noEmit
pnpm format         # Prettier
pnpm db:seed        # seed database
pnpm db:ui          # open Prisma Studio
```

## Infrastructure

Terraform state lives in `infra/terraform/`. Resources are deployed to `eu-central-1`.

```bash
cd infra/terraform
terraform init
terraform plan
terraform apply
```

Required `terraform.tfvars`: `db_password`, `jwt_access_secret`, `jwt_refresh_secret`, `ec2_key_pair_name`, `your_ip_cidr`, `github_repo`.

## Deployment

Deployments are triggered automatically when CI passes on `master`, or manually via `workflow_dispatch`.

The pipeline:
1. Builds and pushes Docker images to ECR (tagged with commit SHA)
2. SCPs `docker-compose.prod.yml` and `nginx.prod.conf` to `/home/ec2-user/bdgt/`
3. Writes `.env` from GitHub Secrets
4. Runs `docker compose pull && up -d && restart nginx`

## HTTPS setup (first time)

HTTPS is handled by Let's Encrypt. Certs are stored on the persistent EBS data volume at `/data/postgres/letsencrypt` and survive instance replacement — you only need to issue them once per domain, not once per instance.

Run once on the EC2 instance after first deploy:

```bash
# Issue certificate (nginx must be running for the ACME challenge)
sudo docker run --rm \
  -v /data/postgres/letsencrypt:/etc/letsencrypt \
  -v /var/www/certbot:/var/www/certbot \
  certbot/certbot certonly \
  --webroot --webroot-path /var/www/certbot \
  -d bdgt-ai.app \
  --email your@email.com \
  --agree-tos --non-interactive

# Restart nginx to load the certificate
docker compose -f /home/ec2-user/bdgt/docker-compose.prod.yml restart nginx
```

Set up auto-renewal via cron on the EC2 instance:

```bash
sudo crontab -e
# Add:
0 3 * * * docker run --rm -v /data/postgres/letsencrypt:/etc/letsencrypt -v /var/www/certbot:/var/www/certbot certbot/certbot renew --quiet && docker compose -f /home/ec2-user/bdgt/docker-compose.prod.yml restart nginx
```

### Migrating certs on an existing instance

If the instance was set up before this change (certs at `/etc/letsencrypt`), migrate once:

```bash
docker compose -f /home/ec2-user/bdgt/docker-compose.prod.yml stop nginx
sudo mkdir -p /data/postgres/letsencrypt
sudo cp -a /etc/letsencrypt/. /data/postgres/letsencrypt/
# Then redeploy or restart nginx to pick up the new volume mount
docker compose -f /home/ec2-user/bdgt/docker-compose.prod.yml up -d nginx
```
