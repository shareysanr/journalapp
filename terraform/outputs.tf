output "instance_id" {
  description = "Imported EC2 instance ID"
  value       = aws_instance.api.id
}

output "instance_private_ip" {
  description = "Private IP of the imported instance"
  value       = aws_instance.api.private_ip
}

output "instance_public_ip" {
  description = "Public IP currently on the instance (auto-assigned or EIP)"
  value       = aws_instance.api.public_ip
}

output "vpc_id" {
  description = "VPC of the existing subnet (data source only)"
  value       = data.aws_vpc.main.id
}

output "subnet_id" {
  description = "Existing subnet ID"
  value       = data.aws_subnet.api.id
}

output "security_group_id" {
  description = "Imported security group ID"
  value       = aws_security_group.api.id
}

output "eip_public_ip" {
  description = "Imported Elastic IP, if eip_allocation_id was set"
  value       = try(aws_eip.api[0].public_ip, null)
}

output "cognito_user_pool_id" {
  description = "Imported Cognito user pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_user_pool_client_id" {
  description = "Imported Cognito app client ID (not the secret)"
  value       = aws_cognito_user_pool_client.app.id
  sensitive   = false
}
