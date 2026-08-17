variable "aws_region" {
  description = "AWS region of the existing resources (must match Cognito and EC2)."
  type        = string
  default     = "us-east-2"
}

variable "project_name" {
  description = "Tag prefix only. Does not rename existing AWS resources on import."
  type        = string
  default     = "clarity"
}

# --- Existing EC2 (copy from AWS Console or aws ec2 describe-instances) ---

variable "instance_id" {
  description = "Existing EC2 instance ID to import (i-...). Not used to create a new instance."
  type        = string
}

variable "ami_id" {
  description = "AMI currently used by the existing instance (from describe-instances). Required after import so Terraform does not propose a new AMI."
  type        = string
}

variable "instance_type" {
  description = "Instance type of the existing EC2 (e.g. t3.micro)."
  type        = string
}

variable "subnet_id" {
  description = "Existing subnet ID (subnet-...). VPC is looked up from this subnet; Terraform does not manage the VPC."
  type        = string
}

variable "security_group_id" {
  description = "Existing security group ID attached to the instance (sg-...). Import this SG; do not create a second one."
  type        = string
}

variable "key_name" {
  description = "Existing EC2 key pair name, or empty if none."
  type        = string
  default     = ""
}

# --- Optional Elastic IP ---

variable "eip_allocation_id" {
  description = "Existing EIP allocation ID (eipalloc-...). Leave empty if the instance has no Elastic IP (do not create one)."
  type        = string
  default     = ""
}

# --- Existing Cognito ---

variable "cognito_user_pool_id" {
  description = "Existing user pool ID (e.g. us-east-2_XXXXXXXXX). Import only; do not create a new pool."
  type        = string
}

variable "cognito_user_pool_name" {
  description = "Name of the existing user pool as shown in Cognito (required by the AWS provider)."
  type        = string
}

variable "cognito_user_pool_client_id" {
  description = "Existing app client ID. Import as POOL_ID/CLIENT_ID."
  type        = string
}

variable "cognito_user_pool_client_name" {
  description = "Name of the existing app client as shown in Cognito."
  type        = string
}

variable "cognito_generate_secret" {
  description = "Must match the existing client (true if COGNITO_CLIENT_SECRET is set in the app)."
  type        = bool
  default     = true
}
