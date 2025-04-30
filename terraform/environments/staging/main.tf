terraform {
  required_version = ">= 1.0.0"
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

  app_name   = "stellarbeat-staging"
  region     = var.region
  repo_url   = var.repo_url
  git_branch = "feature/tmosley/add-terraform-deploy"

  environment   = "staging"
  instance_size = "basic-xs"

  frontend_instance_count = 0
  backend_instance_count  = 1
  scanner_instance_count  = 0
  users_instance_count    = 0

  database_production = false

  feature_flags = {
    experimentalFeatures = false
    betaFeatures         = false
  }

  # Frontend environment variables
  frontend_env = {
    API_URL  = "https://api-staging.stellarbeat.com"
    API_KEY  = var.staging_api_key
    NODE_ENV = "staging"
  }

  # Backend environment variables
  backend_env = {
    ACTIVE_DATABASE_URL           = var.active_database_url
    JWT_SECRET                    = var.staging_jwt_secret
    NODE_ENV                      = "staging"
    IPSTACK_ACCESS_KEY            = var.ipstack_access_key
    HORIZON_URL                   = var.horizon_url
    NETWORK_PASSPHRASE            = var.network_passphrase
    NETWORK_ID                    = var.network_id
    NETWORK_NAME                  = var.network_name
    NETWORK_OVERLAY_VERSION       = var.network_overlay_version
    NETWORK_LEDGER_VERSION        = var.network_ledger_version
    NETWORK_OVERLAY_MIN_VERSION   = var.network_overlay_min_version
    NETWORK_STELLAR_CORE_VERSION  = var.network_stellar_core_version
    NETWORK_QUORUM_SET            = var.network_quorum_set
    NETWORK_KNOWN_PEERS           = var.network_known_peers
    CRAWLER_MAX_CONNECTIONS       = var.crawler_max_connections
    CRAWLER_MAX_CRAWL_TIME        = var.crawler_max_crawl_time
    CRAWLER_BLACKLIST             = var.crawler_blacklist
    NOTIFICATIONS_ENABLED         = var.notifications_enabled
    USER_SERVICE_BASE_URL         = var.user_service_base_url
    USER_SERVICE_USERNAME         = var.user_service_username
    USER_SERVICE_PASSWORD         = var.user_service_password
    FRONTEND_BASE_URL             = var.frontend_base_url
    NETWORK_SCAN_LOOP_INTERVAL_MS = var.network_scan_loop_interval_ms
    HISTORY_SCAN_API_USERNAME     = var.history_scan_api_username
    HISTORY_SCAN_API_PASSWORD     = var.history_scan_api_password
    DEBUG                         = var.debug
    DEADMAN_URL                   = var.deadman_url
    ENABLE_HEART_BEAT             = var.enable_heart_beat
    ENABLE_SENTRY                 = var.enable_sentry
    SENTRY_DSN                    = var.sentry_dsn
    SENTRY_ENVIRONMENT            = var.sentry_environment
    AWS_ACCESS_KEY                = var.aws_access_key
    AWS_SECRET_ACCESS_KEY         = var.aws_secret_access_key
    AWS_REGION                    = var.aws_region
    AWS_BUCKET_NAME               = var.aws_bucket_name
    ENABLE_S3_BACKUP              = var.enable_s3_backup
    DATABASE_POOL_SIZE            = var.database_pool_size
    DATABASE_TEST_URL             = var.database_test_url
    BACKEND_PORT                  = var.backend_port
    USER_AGENT                    = var.user_agent
    ENABLE_S3_BACKUP              = var.enable_s3_backup
    TYPEORM_MIGRATIONS_RUN        = "false"
  }

  # Network Scanner environment variables
  network_scanner_env = {
    ACTIVE_DATABASE_URL          = var.active_database_url
    API_KEY                      = var.staging_api_key
    NODE_ENV                     = "staging"
    IPSTACK_ACCESS_KEY           = var.ipstack_access_key
    HORIZON_URL                  = var.horizon_url
    NETWORK_PASSPHRASE           = var.network_passphrase
    NETWORK_ID                   = var.network_id
    NETWORK_NAME                 = var.network_name
    NETWORK_OVERLAY_VERSION      = var.network_overlay_version
    NETWORK_LEDGER_VERSION       = var.network_ledger_version
    NETWORK_OVERLAY_MIN_VERSION  = var.network_overlay_min_version
    NETWORK_STELLAR_CORE_VERSION = var.network_stellar_core_version
    NETWORK_QUORUM_SET           = var.network_quorum_set
    NETWORK_KNOWN_PEERS          = var.network_known_peers
  }

  # History Scanner environment variables
  history_scanner_env = {
    ACTIVE_DATABASE_URL = var.active_database_url
    API_KEY             = var.staging_api_key
    NODE_ENV            = "staging"
  }

  # Users service environment variables
  users_env = {
    ACTIVE_DATABASE_URL = var.active_database_url
    JWT_SECRET          = var.staging_jwt_secret
    NODE_ENV            = "staging"
    MAILGUN_SECRET      = var.mailgun_secret
    MAILGUN_DOMAIN      = var.mailgun_domain
    MAILGUN_FROM        = var.mailgun_from
    MAILGUN_BASE_URL    = var.mailgun_base_url
  }
}
