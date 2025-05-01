terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}

module "app_platform" {
  source = "../../modules/app_platform"

  app_name   = "stellarbeat-integration"
  region     = var.region
  repo_url   = var.repo_url
  git_branch = "main"

  environment = "integration"
  instance_size = "basic-xs"

  frontend_instance_count = 1
  backend_instance_count  = 1
  scanner_instance_count = 1
  users_instance_count   = 1

  database_production = false

  feature_flags = {
    experimentalFeatures = true
    betaFeatures        = false
  }

  # Frontend environment variables
  frontend_env = {
    API_URL      = "https://api-integration.stellarbeat.com"
    API_KEY      = var.integration_api_key
    NODE_ENV     = "integration"
  }

  # Backend environment variables
  backend_env = {
    DATABASE_URL = var.integration_database_url
    JWT_SECRET   = var.integration_jwt_secret
    NODE_ENV     = "integration"
  }

  # Network Scanner environment variables
  network_scanner_env = {
    DATABASE_URL = var.integration_database_url
    API_KEY      = var.integration_api_key
    NODE_ENV     = "integration"
  }

  # History Scanner environment variables
  history_scanner_env = {
    DATABASE_URL = var.integration_database_url
    API_KEY      = var.integration_api_key
    NODE_ENV     = "integration"
  }

  # Users service environment variables
  users_env = {
    DATABASE_URL = var.integration_database_url
    JWT_SECRET   = var.integration_jwt_secret
    NODE_ENV     = "integration"
  }
} 