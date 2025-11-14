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

  app_name    = "radar-staging"
  region      = var.region
  repo_url    = var.repo_url
  domain_name = var.domain_name
  git_branch  = var.git_branch

  environment                   = "staging"
  instance_size                 = "apps-s-1vcpu-1gb"
  history_scanner_instance_size = "apps-d-2vcpu-8gb"

  frontend_instance_count        = 1
  backend_instance_count         = 1
  testnet_backend_instance_count = 0
  scanner_instance_count         = 1
  testnet_scanner_instance_count = 0
  history_scanner_instance_count = 1
  users_instance_count           = 1
  python_fbas_instance_count     = 1

  database_production = true


  feature_flags = {
    experimentalFeatures = false
    betaFeatures         = false
  }

  # Frontend environment variables
  frontend_env = {
    API_URL                             = "https://radar-staging.withobsrvr.com/api"
    API_KEY                             = var.app_api_key
    NODE_ENV                            = "staging"
    VUE_APP_PUBLIC_API_URL              = "https://radar-staging.withobsrvr.com/api"
    VUE_APP_TEST_API_URL                = "https://radar-staging.withobsrvr.com/testnet-api" # Path to testnet API
    VUE_APP_BLOG_URL                    = "https://www.withobsrvr.com/blog"
    VUE_APP_API_DOC_URL                 = "https://radar-staging.withobsrvr.com/api/docs/"
    VUE_APP_BRAND_NAME                  = "OBSRVR Radar"
    VUE_APP_BRAND_TAGLINE               = "Stellar Network Explorer"
    VUE_APP_BRAND_DESCRIPTION           = "OBSRVR Radar is a network explorer for the Stellar network. It provides a list of all nodes and organizations. It tracks various metrics and provides a history of changes. It also allows you to simulate different network conditions and topologies"
    VUE_APP_BRAND_LOGO_SRC              = "logo.png"
    VUE_APP_BRAND_LOGO_ALT              = "Radar powered by OBSRVR"
    VUE_APP_BRAND_EMAIL                 = "hello@withobsrvr.com"
    VUE_APP_PUBLIC_ENABLE_NOTIFY        = 1
    VUE_APP_PUBLIC_ENABLE_HISTORY       = 1
    VUE_APP_PUBLIC_ENABLE_HORIZON       = 1
    VUE_APP_PUBLIC_ENABLE_CONFIG_EXPORT = 1
    VUE_APP_ENABLE_DEMO_NETWORKS        = 1
  }

  # Backend environment variables
  backend_env = {
    JWT_SECRET                    = var.app_jwt_secret
    NODE_ENV                      = "staging"
    TYPEORM_MIGRATIONS_RUN        = "false"
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
    TYPEORM_MIGRATIONS_RUN        = "false"
    HISTORY_SCAN_API_USERNAME     = var.coordinator_api_username
    HISTORY_SCAN_API_PASSWORD     = var.coordinator_api_password
  }

  # Network Scanner environment variables for mainnet
  network_scanner_env = {
    API_KEY                       = var.app_api_key
    NODE_ENV                      = "staging"
    TYPEORM_MIGRATIONS_RUN        = "false"
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
    DEADMAN_URL                   = var.deadman_url
    ENABLE_HEART_BEAT             = var.enable_heart_beat
    ENABLE_SENTRY                 = var.enable_sentry
    SENTRY_DSN                    = var.sentry_dsn
  }

  # Network Scanner environment variables for testnet
  testnet_scanner_env = {
    API_KEY                      = var.app_api_key
    NODE_ENV                     = "staging"
    IPSTACK_ACCESS_KEY           = var.ipstack_access_key
    HORIZON_URL                  = var.testnet_horizon_url
    NETWORK_PASSPHRASE           = var.testnet_network_passphrase
    NETWORK_ID                   = var.testnet_network_id
    NETWORK_NAME                 = var.testnet_network_name
    NETWORK_OVERLAY_VERSION      = var.testnet_network_overlay_version
    NETWORK_LEDGER_VERSION       = var.testnet_network_ledger_version
    NETWORK_OVERLAY_MIN_VERSION  = var.testnet_network_overlay_min_version
    NETWORK_STELLAR_CORE_VERSION = var.testnet_network_stellar_core_version
    NETWORK_QUORUM_SET           = var.testnet_network_quorum_set
    NETWORK_KNOWN_PEERS          = var.testnet_network_known_peers
    CRAWLER_MAX_CONNECTIONS      = var.crawler_max_connections
    CRAWLER_MAX_CRAWL_TIME       = var.crawler_max_crawl_time
    CRAWLER_BLACKLIST            = var.crawler_blacklist
  }

  # History Scanner environment variables
  history_scanner_env = {
    API_KEY  = var.app_api_key
    NODE_ENV = "staging"


    # Required Backend API Settings
    COORDINATOR_API_BASE_URL = var.app_api_url
    COORDINATOR_API_USERNAME = var.coordinator_api_username
    COORDINATOR_API_PASSWORD = var.coordinator_api_password

    # Optional Settings 
    USER_AGENT                       = var.history_scanner_user_agent
    LOG_LEVEL                        = "info"
    HISTORY_MAX_FILE_MS              = 60000
    HISTORY_SLOW_ARCHIVE_MAX_LEDGERS = 1000

    # Optional Sentry Configuration
    ENABLE_SENTRY = false
    SENTRY_DSN    = var.sentry_dsn
  }

  # Users service environment variables
  users_env = {
    JWT_SECRET        = var.app_jwt_secret
    NODE_ENV          = "staging"
    MAILGUN_SECRET    = var.mailgun_secret
    MAILGUN_DOMAIN    = var.mailgun_domain
    MAILGUN_FROM      = var.mailgun_from
    MAILGUN_BASE_URL  = var.mailgun_base_url
    SENTRY_DSN        = var.sentry_dsn
    ENCRYPTION_SECRET = var.encryption_secret
    HASH_SECRET       = var.hash_secret
    CONSUMER_SECRET   = var.consumer_secret
    CONSUMER_NAME     = var.consumer_name
    PORT              = var.users_port
  }

  # Testnet Backend environment variables
  testnet_backend_env = {
    JWT_SECRET                   = var.app_jwt_secret
    NODE_ENV                     = "staging"
    IPSTACK_ACCESS_KEY           = var.ipstack_access_key
    HORIZON_URL                  = var.testnet_horizon_url
    NETWORK_PASSPHRASE           = var.testnet_network_passphrase
    NETWORK_ID                   = var.testnet_network_id
    NETWORK_NAME                 = var.testnet_network_name
    NETWORK_OVERLAY_VERSION      = var.testnet_network_overlay_version
    NETWORK_LEDGER_VERSION       = var.testnet_network_ledger_version
    NETWORK_OVERLAY_MIN_VERSION  = var.testnet_network_overlay_min_version
    NETWORK_STELLAR_CORE_VERSION = var.testnet_network_stellar_core_version
    NETWORK_QUORUM_SET           = var.testnet_network_quorum_set
    NETWORK_KNOWN_PEERS          = var.testnet_network_known_peers
    CRAWLER_MAX_CONNECTIONS      = var.crawler_max_connections
    CRAWLER_MAX_CRAWL_TIME       = var.crawler_max_crawl_time
    CRAWLER_BLACKLIST            = var.crawler_blacklist
    USER_SERVICE_BASE_URL        = var.user_service_base_url
    USER_SERVICE_USERNAME        = var.user_service_username
    USER_SERVICE_PASSWORD        = var.user_service_password
    BACKEND_PORT                 = var.backend_port
    USER_AGENT                   = var.user_agent
    TYPEORM_MIGRATIONS_RUN       = "false"
  }
}
