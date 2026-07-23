output "ec2_public_ip" {
  description = "Elastic IP of the EC2 instance. Use for DNS A records and SSH."
  value       = aws_eip.app.public_ip
}

output "ec2_public_dns" {
  description = "Public DNS name of the Elastic IP."
  value       = aws_eip.app.public_dns
}

output "ssh_command" {
  description = "Ready-to-run SSH command to connect to the EC2 instance."
  value       = "ssh -i ~/.ssh/${var.ec2_key_pair_name}.pem ec2-user@${aws_eip.app.public_ip}"
}

output "ecr_web_url" {
  description = "ECR repository URL for the web app image. Set as AWS_ACCOUNT_ID source for image tags in GitHub Actions."
  value       = aws_ecr_repository.web.repository_url
}

output "ecr_migrate_url" {
  description = "ECR repository URL for the database migrator image."
  value       = aws_ecr_repository.migrate.repository_url
}

output "github_actions_role_arn" {
  description = "ARN of the IAM role GitHub Actions assumes via OIDC. Set as AWS_ROLE_ARN in GitHub repository variables."
  value       = aws_iam_role.github_actions.arn
}
