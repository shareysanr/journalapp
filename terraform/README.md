# Terraform — import existing AWS (do not recreate)

This stack **adopts** the live journal-app EC2 instance and Cognito pool/client. It does **not** manage Neon, CloudAMQP, Netlify, Docker, or OpenAI.

**Do not run `terraform apply` until `terraform plan` shows no destroy and no replace of the instance, user pool, or app client.**

**Do not run `terraform apply` before `terraform import`.** Applying first would try to **create duplicate** EC2 and Cognito resources.

## 1. Collect IDs from AWS

Region should match Cognito (this project has used `us-east-2`).

```bash
aws sts get-caller-identity

aws ec2 describe-instances --region us-east-2 \
  --query 'Reservations[].Instances[].[InstanceId,ImageId,InstanceType,SubnetId,SecurityGroups,PublicIpAddress,KeyName,State.Name]' \
  --output table

aws ec2 describe-addresses --region us-east-2 \
  --query 'Addresses[].[AllocationId,PublicIp,InstanceId]' \
  --output table

aws cognito-idp list-user-pools --max-results 10 --region us-east-2

aws cognito-idp list-user-pool-clients --region us-east-2 \
  --user-pool-id YOUR_POOL_ID
```

Copy `terraform.tfvars.example` to `terraform.tfvars` and paste the real IDs. `terraform.tfvars` is gitignored.

If there is **no** Elastic IP (only a changing public IP), leave `eip_allocation_id = ""`.

## 2. Init (no apply)

```bash
cd terraform
terraform init
```

## 3. Import existing resources (required)

From the `terraform/` directory, after tfvars is filled:

```bash
# EC2
terraform import aws_instance.api i-xxxxxxxxxxxxxxxxx

# Security group attached to that instance
terraform import aws_security_group.api sg-xxxxxxxx

# Cognito user pool
terraform import aws_cognito_user_pool.main us-east-2_XXXXXXXXX

# Cognito app client (POOL_ID/CLIENT_ID — slash, no spaces)
terraform import aws_cognito_user_pool_client.app \
  us-east-2_XXXXXXXXX/xxxxxxxxxxxxxxxxxxxxxxxxxx
```

Elastic IP **only if** `eip_allocation_id` is set in tfvars:

```bash
terraform import 'aws_eip.api[0]' eipalloc-xxxxxxxx
```

Use the same IDs you put in `terraform.tfvars`.

## 4. Plan — read it before any apply

```bash
terraform plan
```

### Safe plan

- `0 to add, 0 to destroy` (or only in-place **update** of tags)
- Instance, pool, and client show **no** “must be replaced” / “forces replacement”
- No new `aws_instance` or `aws_cognito_user_pool` to **create**

A small tag-only update is OK.

### Dangerous plan — do not apply

Stop if you see any of:

- `aws_instance.api` **destroyed**, **replaced**, or **created** (second VM)
- `aws_cognito_user_pool.main` **replaced** or **created**
- `aws_cognito_user_pool_client.app` **replaced** or **created** (breaks login)
- `aws_security_group.api` **replaced** (can drop SSH/HTTP)
- `aws_eip.api` **created** when you did not have an EIP (new public IP)
- `aws_eip.api` **destroyed** (releases production IP)

If the plan is dangerous: fix tfvars (`ami_id`, `instance_type`, names) or extend `ignore_changes`. **Do not apply.**

## 5. Apply (only after a safe plan)

```bash
terraform apply
```

`prevent_destroy` is set on EC2, Cognito pool, Cognito client, SG, and EIP so a destroy apply should fail. That is not a substitute for reading the plan (replacements can still happen if you ignore the warning).

## Out of scope

Neon, CloudAMQP, Netlify, Docker Hub, Docker Compose, OpenAI, and the VPC itself (subnet/VPC are **data sources** only).
