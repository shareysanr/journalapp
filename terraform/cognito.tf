# Existing Cognito User Pool (app already uses COGNITO_USER_POOL_ID).
# IMPORT before apply:
#   terraform import aws_cognito_user_pool.main us-east-2_XXXXXXXXX
#
# Do not apply if plan creates a new pool or replaces this one (users would be orphaned).
# Pool name comes from terraform.tfvars and must match the imported pool exactly.

resource "aws_cognito_user_pool" "main" {
  name = var.cognito_user_pool_name

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]
  mfa_configuration        = "OFF"
  deletion_protection      = "ACTIVE"
  user_pool_tier           = "ESSENTIALS"

  username_configuration {
    case_sensitive = false
  }

  password_policy {
    minimum_length                   = 8
    password_history_size            = 0
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = true
    require_uppercase                = true
    temporary_password_validity_days = 7
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }

    recovery_mechanism {
      name     = "verified_phone_number"
      priority = 2
    }
  }

  admin_create_user_config {
    allow_admin_create_user_only = false
  }

  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  schema {
    name                     = "email"
    attribute_data_type      = "String"
    developer_only_attribute = false
    mutable                  = true
    required                 = true

    string_attribute_constraints {
      min_length = "0"
      max_length = "2048"
    }
  }

  sign_in_policy {
    allowed_first_auth_factors = ["PASSWORD"]
  }

  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
  }

  lifecycle {
    prevent_destroy = true
    ignore_changes = [
      alias_attributes,
      device_configuration,
      email_mfa_configuration,
      sms_configuration,
      sms_authentication_message,
      lambda_config,
      user_attribute_update_settings,
      user_pool_add_ons,
      software_token_mfa_configuration,
      web_authn_configuration,
      tags,
      tags_all
    ]
  }
}

# Existing app client (COGNITO_CLIENT_ID / secret already in the backend .env).
# IMPORT before apply:
#   terraform import aws_cognito_user_pool_client.app POOL_ID/CLIENT_ID
#
# Do not output the client secret. It will still be stored in Terraform state.

resource "aws_cognito_user_pool_client" "app" {
  name         = var.cognito_user_pool_client_name
  user_pool_id = aws_cognito_user_pool.main.id
  # Do not set generate_secret for the imported app client

  lifecycle {
    prevent_destroy = true
    ignore_changes = [
      explicit_auth_flows,
      supported_identity_providers,
      callback_urls,
      logout_urls,
      default_redirect_uri,
      allowed_oauth_flows,
      allowed_oauth_flows_user_pool_client,
      allowed_oauth_scopes,
      enable_token_revocation,
      enable_propagate_additional_user_context_data,
      auth_session_validity,
      access_token_validity,
      id_token_validity,
      refresh_token_validity,
      token_validity_units,
      prevent_user_existence_errors,
      read_attributes,
      write_attributes,
      analytics_configuration
    ]
  }
}
