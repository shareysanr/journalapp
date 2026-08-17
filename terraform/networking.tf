# Existing VPC/subnet — data sources only. Do not create a VPC.

data "aws_subnet" "api" {
  id = var.subnet_id
}

data "aws_vpc" "main" {
  id = data.aws_subnet.api.vpc_id
}

# Existing security group dedicated to this EC2 instance.
# IMPORT before apply: terraform import aws_security_group.api sg-xxxxxxxx
# Do not apply if plan wants to create a new sg-* or replace this one.
# Ingress/egress are ignored so the first apply cannot lock you out of SSH/HTTP.
# After a clean plan, you can remove ignore_changes and encode the real rules.

resource "aws_security_group" "api" {
  name        = "${var.project_name}-ec2"
  description = "Imported security group for the journal app EC2 instance"
  vpc_id      = data.aws_vpc.main.id

  lifecycle {
    prevent_destroy = true
    ignore_changes = [
      name,
      description,
      ingress,
      egress,
      tags,
      tags_all,
      revoke_rules_on_delete
    ]
  }
}

# Existing Elastic IP — only if eip_allocation_id is set in tfvars.
# IMPORT: terraform import 'aws_eip.api[0]' eipalloc-xxxxxxxx
# Leave eip_allocation_id empty if you only have an auto-assigned public IP.
# Creating a new EIP would change production DNS/networking — do not do that.

resource "aws_eip" "api" {
  count  = var.eip_allocation_id != "" ? 1 : 0
  domain = "vpc"

  lifecycle {
    prevent_destroy = true
    ignore_changes = [
      instance,
      network_interface,
      associate_with_private_ip,
      tags,
      tags_all
    ]
  }
}
