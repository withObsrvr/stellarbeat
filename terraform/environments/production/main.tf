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

  app_name   = "stellarbeat"
  region     = var.region
  repo_url   = var.repo_url
  git_branch = "main"

  environment = "production"
  instance_size = "basic-xs"

  frontend_instance_count = 2
  backend_instance_count  = 2
  scanner_instance_count = 2
  users_instance_count   = 2

  database_production = true

  feature_flags = {
    experimentalFeatures = true
    betaFeatures        = true
  }

  # Frontend environment variables
  frontend_env = {
    API_URL      = "https://api.stellarbeat.com"
    API_KEY      = var.production_api_key
    NODE_ENV     = "production"
  }

  # Backend environment variables
  backend_env = {
    DATABASE_URL = var.production_database_url
    JWT_SECRET   = var.production_jwt_secret
    NODE_ENV     = "production"
  }

  # Network Scanner environment variables
  network_scanner_env = {
    DATABASE_URL = var.production_database_url
    API_KEY      = var.production_api_key
    NODE_ENV     = "production"
  }

  # History Scanner environment variables
  history_scanner_env = {
    DATABASE_URL = var.production_database_url
    API_KEY      = var.production_api_key
    NODE_ENV     = "production"
  }

  # Users service environment variables
  users_env = {
    DATABASE_URL = var.production_database_url
    JWT_SECRET   = var.production_jwt_secret
} 