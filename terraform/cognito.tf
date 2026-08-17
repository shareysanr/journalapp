# Existing Cognito User Pool (app already uses COGNITO_USER_POOL_ID).
# IMPORT before apply:
#   terraform import aws_cognito_user_pool.main us-east-2_XXXXXXXXX
#
# Do not apply if plan creates a new pool or replaces this one (users would be orphaned).

resource "aws_cognito_user_pool" "main" {
  name = var.cognito_user_pool_name

  lifecycle {
    prevent_destroy = true
    ignore_changes = [
      alias_attributes,
      username_attributes,
      username_configuration,
      auto_verified_attributes,
      deletion_protection,
      mfa_configuration,
      password_policy,
      schema,
      account_recovery_setting,
      admin_create_user_config,
      device_configuration,
      email_configuration,
      email_mfa_configuration,
      sms_configuration,
      sms_authentication_message,
      lambda_config,
      user_attribute_update_settings,
      user_pool_add_ons,
      user_pool_tier,
      verification_message_template,
      software_token_mfa_configuration,
      web_authn_configuration,
      sign_in_policy,
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

  generate_secret = var.cognito_generate_secret

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
      idp_identifier,
      analytics_configuration
    ]
  }
}
