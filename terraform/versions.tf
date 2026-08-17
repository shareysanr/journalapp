terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Local state by default. Do not commit *.tfstate.
  # A remote backend can be added later (do not migrate state until import is done).
}

# Existing production resources MUST be imported before the first apply.
# See README.md. Do not terraform apply if plan shows destroy or replace.
