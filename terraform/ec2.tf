# Existing journal-app EC2 instance (Docker + Nginx already on the host).
# IMPORT before apply:
#   terraform import aws_instance.api i-xxxxxxxxxxxxxxxxx
#
# This resource is import-ready. It MUST NOT create a second instance.
# If terraform plan shows destroy or "must be replaced", STOP. Do not apply.

resource "aws_instance" "api" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  subnet_id              = var.subnet_id
  vpc_security_group_ids = [var.security_group_id]
  key_name               = var.key_name != "" ? var.key_name : null

  tags = {
    Name = var.project_name
  }

  lifecycle {
    prevent_destroy = true
    ignore_changes = [
      ami,
      user_data,
      user_data_base64,
      hibernation,
      associate_public_ip_address,
      ipv6_address_count,
      ipv6_addresses,
      cpu_options,
      credit_specification,
      enclave_options,
      maintenance_options,
      metadata_options,
      monitoring,
      placement_partition_number,
      private_dns_name_options,
      secondary_private_ips,
      source_dest_check,
      tenancy,
      host_id,
      host_resource_group_arn,
      capacity_reservation_specification,
      ebs_optimized,
      disable_api_termination,
      disable_api_stop,
      instance_initiated_shutdown_behavior,
      root_block_device,
      ebs_block_device,
      ephemeral_block_device,
      network_interface,
      launch_template
    ]
  }
}
