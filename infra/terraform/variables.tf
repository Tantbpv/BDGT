variable "aws_region" {
  description = "AWS region to deploy all resources into."
  type        = string
  default     = "eu-central-1"
}

variable "environment" {
  description = "Deployment environment name. Used for resource naming and tagging."
  type        = string
  default     = "production"
}

# ── EC2 ──────────────────────────────────────────────────────────────────────

variable "ec2_instance_type" {
  description = "EC2 instance type. t3.micro is free-tier eligible in most regions."
  type        = string
  default     = "t3.micro"
}

variable "ec2_key_pair_name" {
  description = "Name of an existing AWS key pair to use for SSH access. Create it in AWS Console → EC2 → Key Pairs before applying."
  type        = string
}

# ── EBS data volume ───────────────────────────────────────────────────────────

variable "ebs_data_volume_size" {
  description = "Size of the EBS volume for PostgreSQL data in GB."
  type        = number
  default     = 20
}

# ── Database ──────────────────────────────────────────────────────────────────

variable "db_name" {
  description = "Name of the PostgreSQL database."
  type        = string
  default     = "bdgt"
}

variable "db_username" {
  description = "PostgreSQL superuser username."
  type        = string
  default     = "bdgt"
}

variable "db_password" {
  description = "PostgreSQL superuser password. Store only in terraform.tfvars (gitignored)."
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.db_password) >= 8
    error_message = "db_password must be at least 8 characters."
  }
}

# ── Application secrets ───────────────────────────────────────────────────────

variable "jwt_access_secret" {
  description = "Secret for signing JWT access tokens. Must be at least 32 characters."
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.jwt_access_secret) >= 32
    error_message = "jwt_access_secret must be at least 32 characters (enforced by packages/config/src/env.ts)."
  }
}

variable "jwt_refresh_secret" {
  description = "Secret for signing JWT refresh tokens. Must be at least 32 characters."
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.jwt_refresh_secret) >= 32
    error_message = "jwt_refresh_secret must be at least 32 characters (enforced by packages/config/src/env.ts)."
  }
}

variable "jwt_access_expires_in" {
  description = "JWT access token expiry."
  type        = string
  default     = "15m"
}

variable "jwt_refresh_expires_in" {
  description = "JWT refresh token expiry."
  type        = string
  default     = "7d"
}

variable "log_level" {
  description = "Application log level."
  type        = string
  default     = "info"

  validation {
    condition     = contains(["trace", "debug", "info", "warn", "error", "fatal"], var.log_level)
    error_message = "log_level must be one of: trace, debug, info, warn, error, fatal."
  }
}

# ── Network ───────────────────────────────────────────────────────────────────

variable "your_ip_cidr" {
  description = "Your public IP in CIDR notation (e.g. 203.0.113.42/32). Restricts SSH access. Find yours at https://checkip.amazonaws.com."
  type        = string

  validation {
    condition     = can(cidrnetmask(var.your_ip_cidr))
    error_message = "your_ip_cidr must be a valid CIDR block, e.g. 203.0.113.42/32."
  }
}

# ── CI/CD ─────────────────────────────────────────────────────────────────────

variable "github_repo" {
  description = "GitHub repository in 'owner/name' format (e.g. 'acme/bdgt'). Used to scope the OIDC trust condition so only workflows from this repo can assume the GitHub Actions IAM role."
  type        = string
}
