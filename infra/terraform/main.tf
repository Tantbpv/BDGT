terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment after creating an S3 bucket + DynamoDB table for remote state
  # backend "s3" {
  #   bucket         = "bdgt-terraform-state"
  #   key            = "mvp/terraform.tfstate"
  #   region         = "eu-central-1"
  #   dynamodb_table = "bdgt-terraform-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "bdgt"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
