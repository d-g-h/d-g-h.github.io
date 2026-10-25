terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }
}

variable "cloudflare_api_token" {
  type      = string
  sensitive = true
}

variable "account_id" {
  type = string
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

resource "cloudflare_r2_bucket" "resume_files" {
  account_id = var.account_id
  name       = "private-resume-files"
}

output "resume_bucket" {
  value = cloudflare_r2_bucket.resume_files.name
}
