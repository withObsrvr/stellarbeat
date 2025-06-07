terraform {
  required_providers {
    digitalocean = {
      source = "digitalocean/digitalocean"
    }
  }
}

# Create a database cluster
resource "digitalocean_database_cluster" "radar_db" {
  name    = "${var.app_name}-db"
  engine  = "pg"
  version = var.database_version_postgres
  # Use a larger database size for production
  size       = var.database_production ? "db-s-2vcpu-4gb" : "db-s-1vcpu-1gb"
  region     = var.region
  node_count = 1
}

# Add trusted sources (firewall rules) to restrict database access
resource "digitalocean_database_firewall" "radar_db_firewall" {
  cluster_id = digitalocean_database_cluster.radar_db.id

  # Explicitly add the entire App Platform app as a trusted source
  rule {
    type  = "app"
    value = digitalocean_app.radar.id
  }
}

# Create main database
resource "digitalocean_database_db" "radar_db" {
  cluster_id = digitalocean_database_cluster.radar_db.id
  name       = "radar"
}

# Create testnet database
resource "digitalocean_database_db" "radar_testnet_db" {
  cluster_id = digitalocean_database_cluster.radar_db.id
  name       = "radar_testnet"
}

# Create users database
resource "digitalocean_database_db" "radar_users_db" {
  cluster_id = digitalocean_database_cluster.radar_db.id
  name       = "radar_users"
}

# We'll use the default doadmin user which already has all necessary permissions
# No need to create a separate user or grant permissions

# Create app deployment
resource "digitalocean_app" "radar" {
  spec {
    name   = var.app_name
    region = var.region
    domain {
      name = var.domain_name
    }

    # Frontend Service - conditionally deployed based on instance count
    dynamic "service" {
      for_each = var.frontend_instance_count > 0 ? [1] : []
      content {
        name               = "frontend"
        instance_count     = var.frontend_instance_count
        instance_size_slug = var.instance_size

        git {
          repo_clone_url = var.repo_url
          branch         = var.git_branch
        }

        # Environment variables - explicitly defined
        env {
          key   = "NODE_ENV"
          value = var.environment
        }

        env {
          key   = "FEATURE_FLAGS"
          value = jsonencode(var.feature_flags)
        }

        # API_URL if provided
        env {
          key   = "API_URL"
          value = lookup(var.frontend_env, "API_URL", "")
          type  = "GENERAL"
        }

        # API_KEY if provided
        env {
          key   = "API_KEY"
          value = lookup(var.frontend_env, "API_KEY", "")
          type  = "SECRET"
        }

        # VUE_PUBLIC_API_URL if provided
        env {
          key   = "VUE_APP_PUBLIC_API_URL"
          value = lookup(var.frontend_env, "VUE_APP_PUBLIC_API_URL", "")
          type  = "GENERAL"
        }

        # VUE_APP_BLOG_URL if provided
        env {
          key   = "VUE_APP_BLOG_URL"
          value = lookup(var.frontend_env, "VUE_APP_BLOG_URL", "")
          type  = "GENERAL"
        }

        # VUE_APP_API_DOC_URL if provided
        env {
          key   = "VUE_APP_API_DOC_URL"
          value = lookup(var.frontend_env, "VUE_APP_API_DOC_URL", "")
          type  = "GENERAL"
        }

        # VUE_APP_BRAND_NAME if provided
        env {
          key   = "VUE_APP_BRAND_NAME"
          value = lookup(var.frontend_env, "VUE_APP_BRAND_NAME", "")
          type  = "GENERAL"
        }

        # VUE_APP_BRAND_TAGLINE if provided
        env {
          key   = "VUE_APP_BRAND_TAGLINE"
          value = lookup(var.frontend_env, "VUE_APP_BRAND_TAGLINE", "")
          type  = "GENERAL"
        }

        # VUE_APP_BRAND_DESCRIPTION if provided
        env {
          key   = "VUE_APP_BRAND_DESCRIPTION"
          value = lookup(var.frontend_env, "VUE_APP_BRAND_DESCRIPTION", "")
          type  = "GENERAL"
        }

        # VUE_APP_BRAND_LOGO_SRC if provided
        env {
          key   = "VUE_APP_BRAND_LOGO_SRC"
          value = lookup(var.frontend_env, "VUE_APP_BRAND_LOGO_SRC", "")
          type  = "GENERAL"
        }

        # VUE_APP_BRAND_LOGO_ALT if provided
        env {
          key   = "VUE_APP_BRAND_LOGO_ALT"
          value = lookup(var.frontend_env, "VUE_APP_BRAND_LOGO_ALT", "")
          type  = "GENERAL"
        }

        # VUE_APP_BRAND_EMAIL if provided
        env {
          key   = "VUE_APP_BRAND_EMAIL"
          value = lookup(var.frontend_env, "VUE_APP_BRAND_EMAIL", "")
          type  = "GENERAL"
        }

        # VUE_APP_PUBLIC_ENABLE_NOTIFY if provided
        env {
          key   = "VUE_APP_PUBLIC_ENABLE_NOTIFY"
          value = lookup(var.frontend_env, "VUE_APP_PUBLIC_ENABLE_NOTIFY", "")
          type  = "GENERAL"
        }

        # VUE_APP_PUBLIC_ENABLE_HISTORY if provided
        env {
          key   = "VUE_APP_PUBLIC_ENABLE_HISTORY"
          value = lookup(var.frontend_env, "VUE_APP_PUBLIC_ENABLE_HISTORY", "")
          type  = "GENERAL"
        }

        # VUE_APP_PUBLIC_ENABLE_HORIZON if provided
        env {
          key   = "VUE_APP_PUBLIC_ENABLE_HORIZON"
          value = lookup(var.frontend_env, "VUE_APP_PUBLIC_ENABLE_HORIZON", "")
          type  = "GENERAL"
        }

        # VUE_APP_PUBLIC_ENABLE_CONFIG_EXPORT if provided
        env {
          key   = "VUE_APP_PUBLIC_ENABLE_CONFIG_EXPORT"
          value = lookup(var.frontend_env, "VUE_APP_PUBLIC_ENABLE_CONFIG_EXPORT", "")
          type  = "GENERAL"
        }

        # VUE_APP_ENABLE_DEMO_NETWORKS if provided
        env {
          key   = "VUE_APP_ENABLE_DEMO_NETWORKS"
          value = lookup(var.frontend_env, "VUE_APP_ENABLE_DEMO_NETWORKS", "")
          type  = "GENERAL"
        }

        # VUE_APP_TEST_API_URL if provided - URL for the testnet API
        env {
          key   = "VUE_APP_TEST_API_URL"
          value = lookup(var.frontend_env, "VUE_APP_TEST_API_URL", "")
          type  = "GENERAL"
        }





        http_port = 3000

        health_check {
          http_path = "/health"
        }

        run_command = "pnpm start:frontend"
      }
    }

    # Backend Service - conditionally deployed based on instance count
    dynamic "service" {
      for_each = var.backend_instance_count > 0 ? [1] : []
      content {
        name               = "backend"
        instance_count     = var.backend_instance_count
        instance_size_slug = var.instance_size

        git {
          repo_clone_url = var.repo_url
          branch         = var.git_branch
        }

        # Environment variables - explicitly defined
        env {
          key   = "NODE_ENV"
          value = var.environment
        }

        env {
          key   = "FEATURE_FLAGS"
          value = jsonencode(var.feature_flags)
        }

        # Use database connection string with doadmin user (already has all necessary permissions)
        env {
          key   = "ACTIVE_DATABASE_URL"
          value = "postgres://${digitalocean_database_cluster.radar_db.user}:${digitalocean_database_cluster.radar_db.password}@${digitalocean_database_cluster.radar_db.host}:${digitalocean_database_cluster.radar_db.port}/${digitalocean_database_db.radar_db.name}?sslmode=no-verify"
          type  = "SECRET"
        }

        # Use database connection string with doadmin user (already has all necessary permissions)
        env {
          key   = "DATABASE_TEST_URL"
          value = "postgres://${digitalocean_database_cluster.radar_db.user}:${digitalocean_database_cluster.radar_db.password}@${digitalocean_database_cluster.radar_db.host}:${digitalocean_database_cluster.radar_db.port}/${digitalocean_database_db.radar_db.name}?sslmode=no-verify"
          type  = "SECRET"
        }

        # History Scan API Username if provided
        env {
          key   = "HISTORY_SCAN_API_USERNAME"
          value = lookup(var.backend_env, "HISTORY_SCAN_API_USERNAME", "")
          type  = "SECRET"
        }

        # History Scan API Password if provided
        env {
          key   = "HISTORY_SCAN_API_PASSWORD"
          value = lookup(var.backend_env, "HISTORY_SCAN_API_PASSWORD", "")
          type  = "SECRET"
        }

        # JWT Secret if provided
        env {
          key   = "JWT_SECRET"
          value = lookup(var.backend_env, "JWT_SECRET", "")
          type  = "SECRET"
        }

        # IPSTACK Access Key if provided
        env {
          key   = "IPSTACK_ACCESS_KEY"
          value = lookup(var.backend_env, "IPSTACK_ACCESS_KEY", "")
          type  = "SECRET"
        }
        # Horizon URL if provided
        env {
          key   = "HORIZON_URL"
          value = lookup(var.backend_env, "HORIZON_URL", "")
          type  = "GENERAL"
        }
        # Deadman URL if provided
        env {
          key   = "DEADMAN_URL"
          value = lookup(var.backend_env, "DEADMAN_URL", "")
          type  = "GENERAL"
        }
        # Network Passphrase if provided
        env {
          key   = "NETWORK_PASSPHRASE"
          value = lookup(var.backend_env, "NETWORK_PASSPHRASE", "")
          type  = "GENERAL"
        }
        # Network ID if provided
        env {
          key   = "NETWORK_ID"
          value = lookup(var.backend_env, "NETWORK_ID", "")
          type  = "GENERAL"
        }
        # Network Name if provided
        env {
          key   = "NETWORK_NAME"
          value = lookup(var.backend_env, "NETWORK_NAME", "")
          type  = "GENERAL"
        }
        # Network Overlay Version if provided
        env {
          key   = "NETWORK_OVERLAY_VERSION"
          value = lookup(var.backend_env, "NETWORK_OVERLAY_VERSION", "")
          type  = "GENERAL"
        }
        # Network Ledger Version if provided
        env {
          key   = "NETWORK_LEDGER_VERSION"
          value = lookup(var.backend_env, "NETWORK_LEDGER_VERSION", "")
          type  = "GENERAL"
        }
        # Network Overlay Min Version if provided
        env {
          key   = "NETWORK_OVERLAY_MIN_VERSION"
          value = lookup(var.backend_env, "NETWORK_OVERLAY_MIN_VERSION", "")
          type  = "GENERAL"
        }
        # Network Stellar Core Version if provided
        env {
          key   = "NETWORK_STELLAR_CORE_VERSION"
          value = lookup(var.backend_env, "NETWORK_STELLAR_CORE_VERSION", "")
          type  = "GENERAL"
        }
        # Network Quorum Set if provided
        env {
          key   = "NETWORK_QUORUM_SET"
          value = lookup(var.backend_env, "NETWORK_QUORUM_SET", "")
          type  = "GENERAL"
        }
        # Network Known Peers if provided
        env {
          key   = "NETWORK_KNOWN_PEERS"
          value = lookup(var.backend_env, "NETWORK_KNOWN_PEERS", "")
          type  = "GENERAL"
        }

        env {
          key   = "BACKEND_PORT"
          value = lookup(var.backend_env, "BACKEND_PORT", "")
          type  = "GENERAL"
        }

        # User Service Base URL if provided
        env {
          key   = "USER_SERVICE_BASE_URL"
          value = lookup(var.backend_env, "USER_SERVICE_BASE_URL", "")
          type  = "GENERAL"
        }

        env {
          key   = "USER_SERVICE_USERNAME"
          value = lookup(var.backend_env, "USER_SERVICE_USERNAME", "")
          type  = "GENERAL"
        }

        # User Service Password if provided
        env {
          key   = "USER_SERVICE_PASSWORD"
          value = lookup(var.backend_env, "USER_SERVICE_PASSWORD", "")
          type  = "SECRET"
        }

        # Notifications enabled if provided
        env {
          key   = "NOTIFICATIONS_ENABLED"
          value = lookup(var.backend_env, "NOTIFICATIONS_ENABLED", "")
          type  = "GENERAL"
        }

        # Frontend Base URL if provided
        env {
          key   = "FRONTEND_BASE_URL"
          value = lookup(var.backend_env, "FRONTEND_BASE_URL", "")
          type  = "GENERAL"
        }

        http_port = lookup(var.backend_env, "BACKEND_PORT", 3000)

        health_check {
          http_path = "/health"
        }

        build_command = "pnpm build"
        run_command   = "pnpm start:api"
      }
    }

    # Network Scanner as a worker - conditionally deployed based on instance count
    dynamic "worker" {
      for_each = var.scanner_instance_count > 0 ? [1] : []
      content {
        name               = "network-scanner"
        instance_count     = var.scanner_instance_count
        instance_size_slug = var.instance_size

        git {
          repo_clone_url = var.repo_url
          branch         = var.git_branch
        }

        # Environment variables - explicitly defined
        env {
          key   = "NODE_ENV"
          value = var.environment
        }

        env {
          key   = "FEATURE_FLAGS"
          value = jsonencode(var.feature_flags)
        }

        # Use database connection string with doadmin user (already has all necessary permissions)
        env {
          key   = "ACTIVE_DATABASE_URL"
          value = "postgres://${digitalocean_database_cluster.radar_db.user}:${digitalocean_database_cluster.radar_db.password}@${digitalocean_database_cluster.radar_db.host}:${digitalocean_database_cluster.radar_db.port}/${digitalocean_database_db.radar_db.name}?sslmode=no-verify"
          type  = "SECRET"
        }

        # API Key if provided
        env {
          key   = "API_KEY"
          value = lookup(var.network_scanner_env, "API_KEY", "")
          type  = "SECRET"
        }

        # IPSTACK Access Key if provided
        env {
          key   = "IPSTACK_ACCESS_KEY"
          value = lookup(var.network_scanner_env, "IPSTACK_ACCESS_KEY", "")
          type  = "SECRET"
        }

        # Horizon URL if provided
        env {
          key   = "HORIZON_URL"
          value = lookup(var.network_scanner_env, "HORIZON_URL", "")
          type  = "GENERAL"
        }

        # Network Passphrase if provided
        env {
          key   = "NETWORK_PASSPHRASE"
          value = lookup(var.network_scanner_env, "NETWORK_PASSPHRASE", "")
          type  = "GENERAL"
        }
        # Network ID if provided
        env {
          key   = "NETWORK_ID"
          value = lookup(var.network_scanner_env, "NETWORK_ID", "")
          type  = "GENERAL"
        }
        # Network Name if provided
        env {
          key   = "NETWORK_NAME"
          value = lookup(var.network_scanner_env, "NETWORK_NAME", "")
          type  = "GENERAL"
        }
        # Network Overlay Version if provided
        env {
          key   = "NETWORK_OVERLAY_VERSION"
          value = lookup(var.network_scanner_env, "NETWORK_OVERLAY_VERSION", "")
          type  = "GENERAL"
        }
        # Network Ledger Version if provided
        env {
          key   = "NETWORK_LEDGER_VERSION"
          value = lookup(var.network_scanner_env, "NETWORK_LEDGER_VERSION", "")
          type  = "GENERAL"
        }
        # Network Overlay Min Version if provided
        env {
          key   = "NETWORK_OVERLAY_MIN_VERSION"
          value = lookup(var.network_scanner_env, "NETWORK_OVERLAY_MIN_VERSION", "")
          type  = "GENERAL"
        }
        # Network Stellar Core Version if provided
        env {
          key   = "NETWORK_STELLAR_CORE_VERSION"
          value = lookup(var.network_scanner_env, "NETWORK_STELLAR_CORE_VERSION", "")
          type  = "GENERAL"
        }
        # Network Quorum Set if provided
        env {
          key   = "NETWORK_QUORUM_SET"
          value = lookup(var.network_scanner_env, "NETWORK_QUORUM_SET", "")
          type  = "GENERAL"
        }
        # Network Known Peers if provided
        env {
          key   = "NETWORK_KNOWN_PEERS"
          value = lookup(var.network_scanner_env, "NETWORK_KNOWN_PEERS", "")
          type  = "GENERAL"
        }

        # Additional flags useful for background tasks
        env {
          key   = "CRAWLER_MAX_CONNECTIONS"
          value = lookup(var.network_scanner_env, "CRAWLER_MAX_CONNECTIONS", "25")
          type  = "GENERAL"
        }

        env {
          key   = "CRAWLER_MAX_CRAWL_TIME"
          value = lookup(var.network_scanner_env, "CRAWLER_MAX_CRAWL_TIME", "900000")
          type  = "GENERAL"
        }

        env {
          key   = "CRAWLER_BLACKLIST"
          value = lookup(var.network_scanner_env, "CRAWLER_BLACKLIST", "")
          type  = "GENERAL"
        }

        # Notification-related environment variables
        env {
          key   = "NOTIFICATIONS_ENABLED"
          value = lookup(var.network_scanner_env, "NOTIFICATIONS_ENABLED", "")
          type  = "GENERAL"
        }

        env {
          key   = "USER_SERVICE_BASE_URL"
          value = lookup(var.network_scanner_env, "USER_SERVICE_BASE_URL", "")
          type  = "GENERAL"
        }

        env {
          key   = "USER_SERVICE_USERNAME"
          value = lookup(var.network_scanner_env, "USER_SERVICE_USERNAME", "")
          type  = "GENERAL"
        }

        env {
          key   = "USER_SERVICE_PASSWORD"
          value = lookup(var.network_scanner_env, "USER_SERVICE_PASSWORD", "")
          type  = "SECRET"
        }

        env {
          key   = "FRONTEND_BASE_URL"
          value = lookup(var.network_scanner_env, "FRONTEND_BASE_URL", "")
          type  = "GENERAL"
        }

        env {
          key   = "NETWORK_SCAN_LOOP_INTERVAL_MS"
          value = lookup(var.network_scanner_env, "NETWORK_SCAN_LOOP_INTERVAL_MS", "")
          type  = "GENERAL"
        }

        env {
          key   = "DEADMAN_URL"
          value = lookup(var.network_scanner_env, "DEADMAN_URL", "")
          type  = "GENERAL"
        }

        env {
          key   = "ENABLE_HEART_BEAT"
          value = lookup(var.network_scanner_env, "ENABLE_HEART_BEAT", "")
          type  = "GENERAL"
        }

        env {
          key   = "ENABLE_SENTRY"
          value = lookup(var.network_scanner_env, "ENABLE_SENTRY", "")
          type  = "GENERAL"
        }

        env {
          key   = "SENTRY_DSN"
          value = lookup(var.network_scanner_env, "SENTRY_DSN", "")
          type  = "SECRET"
        }

        build_command = "pnpm build"
        run_command   = "pnpm start:scan-network 1"
      }
    }

    # Testnet Network Scanner as a worker - conditionally deployed based on instance count
    dynamic "worker" {
      for_each = var.testnet_scanner_instance_count > 0 ? [1] : []
      content {
        name               = "testnet-scanner"
        instance_count     = var.testnet_scanner_instance_count
        instance_size_slug = var.instance_size

        git {
          repo_clone_url = var.repo_url
          branch         = var.git_branch
        }

        # Environment variables - explicitly defined
        env {
          key   = "NODE_ENV"
          value = var.environment
        }

        env {
          key   = "FEATURE_FLAGS"
          value = jsonencode(var.feature_flags)
        }

        # Use database connection string with doadmin user (already has all necessary permissions) - point to testnet database
        env {
          key   = "ACTIVE_DATABASE_URL"
          value = "postgres://${digitalocean_database_cluster.radar_db.user}:${digitalocean_database_cluster.radar_db.password}@${digitalocean_database_cluster.radar_db.host}:${digitalocean_database_cluster.radar_db.port}/${digitalocean_database_db.radar_testnet_db.name}?sslmode=no-verify"
          type  = "SECRET"
        }

        # API Key if provided
        env {
          key   = "API_KEY"
          value = lookup(var.testnet_scanner_env, "API_KEY", "")
          type  = "SECRET"
        }

        # IPSTACK Access Key if provided
        env {
          key   = "IPSTACK_ACCESS_KEY"
          value = lookup(var.testnet_scanner_env, "IPSTACK_ACCESS_KEY", "")
          type  = "SECRET"
        }

        # Horizon URL for Testnet
        env {
          key   = "HORIZON_URL"
          value = lookup(var.testnet_scanner_env, "HORIZON_URL", "https://horizon-testnet.stellar.org")
          type  = "GENERAL"
        }

        # Testnet Network Passphrase 
        env {
          key   = "NETWORK_PASSPHRASE"
          value = lookup(var.testnet_scanner_env, "NETWORK_PASSPHRASE", "Test SDF Network ; September 2015")
          type  = "GENERAL"
        }

        # Network ID for Testnet
        env {
          key   = "NETWORK_ID"
          value = lookup(var.testnet_scanner_env, "NETWORK_ID", "testnet")
          type  = "GENERAL"
        }

        # Network Name for Testnet
        env {
          key   = "NETWORK_NAME"
          value = lookup(var.testnet_scanner_env, "NETWORK_NAME", "Stellar Testnet")
          type  = "GENERAL"
        }

        # Network Overlay Version if provided
        env {
          key   = "NETWORK_OVERLAY_VERSION"
          value = lookup(var.testnet_scanner_env, "NETWORK_OVERLAY_VERSION", "37")
          type  = "GENERAL"
        }

        # Network Ledger Version if provided
        env {
          key   = "NETWORK_LEDGER_VERSION"
          value = lookup(var.testnet_scanner_env, "NETWORK_LEDGER_VERSION", "22")
          type  = "GENERAL"
        }

        # Network Overlay Min Version if provided
        env {
          key   = "NETWORK_OVERLAY_MIN_VERSION"
          value = lookup(var.testnet_scanner_env, "NETWORK_OVERLAY_MIN_VERSION", "35")
          type  = "GENERAL"
        }

        # Network Stellar Core Version if provided
        env {
          key   = "NETWORK_STELLAR_CORE_VERSION"
          value = lookup(var.testnet_scanner_env, "NETWORK_STELLAR_CORE_VERSION", "22.2.0")
          type  = "GENERAL"
        }

        # Network Quorum Set for Testnet with provided validators
        env {
          key   = "NETWORK_QUORUM_SET"
          value = lookup(var.testnet_scanner_env, "NETWORK_QUORUM_SET", "[['GDKXE2OZMJIPOSLNA6N6F2BVCI3O777I2OOC4BV7VOYUEHYX7RTRYA7Y','GC2V2EFSXN6SQTWVYA5EPJPBWWIMSD2XQNKUOHGEKB535AQE2I6IXV2Z','GCUCJTIYXSOXKBSNFGNFWW5MUQ54HKRPGJUTQFJ5RQXZXNOLNXYDHRAP']]")
          type  = "GENERAL"
        }

        # Network Known Peers for Testnet
        env {
          key   = "NETWORK_KNOWN_PEERS"
          value = lookup(var.testnet_scanner_env, "NETWORK_KNOWN_PEERS", "54.166.220.249:11625,44.223.45.116:11625,54.159.138.198:11625")
          type  = "GENERAL"
        }

        # Additional flags useful for background tasks
        env {
          key   = "CRAWLER_MAX_CONNECTIONS"
          value = lookup(var.testnet_scanner_env, "CRAWLER_MAX_CONNECTIONS", "25")
          type  = "GENERAL"
        }

        env {
          key   = "CRAWLER_MAX_CRAWL_TIME"
          value = lookup(var.testnet_scanner_env, "CRAWLER_MAX_CRAWL_TIME", "900000")
          type  = "GENERAL"
        }

        env {
          key   = "CRAWLER_BLACKLIST"
          value = lookup(var.testnet_scanner_env, "CRAWLER_BLACKLIST", "")
          type  = "GENERAL"
        }

        build_command = "pnpm build"
        run_command   = "pnpm start:scan-network 1"
      }
    }

    # History Scanner as a worker - conditionally deployed based on instance count
    dynamic "worker" {
      for_each = var.history_scanner_instance_count > 0 ? [1] : []
      content {
        name               = "history-scanner"
        instance_count     = var.history_scanner_instance_count
        instance_size_slug = var.instance_size

        git {
          repo_clone_url = var.repo_url
          branch         = var.git_branch
        }

        # Environment variables - explicitly defined
        env {
          key   = "NODE_ENV"
          value = var.environment
        }

        env {
          key   = "FEATURE_FLAGS"
          value = jsonencode(var.feature_flags)
        }

        # Use database connection string with doadmin user (already has all necessary permissions)
        env {
          key   = "ACTIVE_DATABASE_URL"
          value = "postgres://${digitalocean_database_cluster.radar_db.user}:${digitalocean_database_cluster.radar_db.password}@${digitalocean_database_cluster.radar_db.host}:${digitalocean_database_cluster.radar_db.port}/${digitalocean_database_db.radar_db.name}?sslmode=no-verify"
          type  = "SECRET"
        }

        # API Key if provided
        env {
          key   = "API_KEY"
          value = lookup(var.history_scanner_env, "API_KEY", "")
          type  = "SECRET"
        }

        # User Agent if provided
        env {
          key   = "USER_AGENT"
          value = lookup(var.history_scanner_env, "USER_AGENT", "")
          type  = "GENERAL"
        }

        # Coordinator API Base URL if provided
        env {
          key   = "COORDINATOR_API_BASE_URL"
          value = lookup(var.history_scanner_env, "COORDINATOR_API_BASE_URL", "")
          type  = "GENERAL"
        }

        # Coordinator API Username if provided
        env {
          key   = "COORDINATOR_API_USERNAME"
          value = lookup(var.history_scanner_env, "COORDINATOR_API_USERNAME", "")
          type  = "GENERAL"
        }

        # Coordinator API Password if provided
        env {
          key   = "COORDINATOR_API_PASSWORD"
          value = lookup(var.history_scanner_env, "COORDINATOR_API_PASSWORD", "")
          type  = "SECRET"
        }

        build_command = "pnpm build"
        run_command   = "pnpm start:scan-history"
      }
    }

    # Testnet Backend Service - conditionally deployed based on instance count
    dynamic "service" {
      for_each = var.testnet_backend_instance_count > 0 ? [1] : []
      content {
        name               = "testnet-backend"
        instance_count     = var.testnet_backend_instance_count
        instance_size_slug = var.instance_size

        git {
          repo_clone_url = var.repo_url
          branch         = var.git_branch
        }

        # Environment variables - explicitly defined
        env {
          key   = "NODE_ENV"
          value = var.environment
        }

        env {
          key   = "FEATURE_FLAGS"
          value = jsonencode(var.feature_flags)
        }

        # Use database connection string with doadmin user (already has all necessary permissions) - point to testnet database
        env {
          key   = "ACTIVE_DATABASE_URL"
          value = "postgres://${digitalocean_database_cluster.radar_db.user}:${digitalocean_database_cluster.radar_db.password}@${digitalocean_database_cluster.radar_db.host}:${digitalocean_database_cluster.radar_db.port}/${digitalocean_database_db.radar_testnet_db.name}?sslmode=no-verify"
          type  = "SECRET"
        }

        # JWT Secret if provided
        env {
          key   = "JWT_SECRET"
          value = lookup(var.testnet_backend_env, "JWT_SECRET", "")
          type  = "SECRET"
        }

        # IPSTACK Access Key if provided
        env {
          key   = "IPSTACK_ACCESS_KEY"
          value = lookup(var.testnet_backend_env, "IPSTACK_ACCESS_KEY", "")
          type  = "SECRET"
        }
        # Horizon URL if provided - use testnet
        env {
          key   = "HORIZON_URL"
          value = lookup(var.testnet_backend_env, "HORIZON_URL", "https://horizon-testnet.stellar.org")
          type  = "GENERAL"
        }
        # Deadman URL if provided
        env {
          key   = "DEADMAN_URL"
          value = lookup(var.testnet_backend_env, "DEADMAN_URL", "")
          type  = "GENERAL"
        }
        # Network Passphrase if provided - use testnet
        env {
          key   = "NETWORK_PASSPHRASE"
          value = lookup(var.testnet_backend_env, "NETWORK_PASSPHRASE", "Test SDF Network ; September 2015")
          type  = "GENERAL"
        }
        # Network ID if provided - use testnet
        env {
          key   = "NETWORK_ID"
          value = lookup(var.testnet_backend_env, "NETWORK_ID", "testnet")
          type  = "GENERAL"
        }
        # Network Name if provided - use testnet
        env {
          key   = "NETWORK_NAME"
          value = lookup(var.testnet_backend_env, "NETWORK_NAME", "Stellar Testnet")
          type  = "GENERAL"
        }
        # Network Overlay Version if provided
        env {
          key   = "NETWORK_OVERLAY_VERSION"
          value = lookup(var.testnet_backend_env, "NETWORK_OVERLAY_VERSION", "37")
          type  = "GENERAL"
        }
        # Network Ledger Version if provided
        env {
          key   = "NETWORK_LEDGER_VERSION"
          value = lookup(var.testnet_backend_env, "NETWORK_LEDGER_VERSION", "22")
          type  = "GENERAL"
        }
        # Network Overlay Min Version if provided
        env {
          key   = "NETWORK_OVERLAY_MIN_VERSION"
          value = lookup(var.testnet_backend_env, "NETWORK_OVERLAY_MIN_VERSION", "35")
          type  = "GENERAL"
        }
        # Network Stellar Core Version if provided
        env {
          key   = "NETWORK_STELLAR_CORE_VERSION"
          value = lookup(var.testnet_backend_env, "NETWORK_STELLAR_CORE_VERSION", "22.2.0")
          type  = "GENERAL"
        }
        # Network Quorum Set if provided - use testnet values
        env {
          key   = "NETWORK_QUORUM_SET"
          value = lookup(var.testnet_backend_env, "NETWORK_QUORUM_SET", "[['GDKXE2OZMJIPOSLNA6N6F2BVCI3O777I2OOC4BV7VOYUEHYX7RTRYA7Y','GC2V2EFSXN6SQTWVYA5EPJPBWWIMSD2XQNKUOHGEKB535AQE2I6IXV2Z','GCUCJTIYXSOXKBSNFGNFWW5MUQ54HKRPGJUTQFJ5RQXZXNOLNXYDHRAP']]")
          type  = "GENERAL"
        }
        # Network Known Peers if provided - use testnet
        env {
          key   = "NETWORK_KNOWN_PEERS"
          value = lookup(var.testnet_backend_env, "NETWORK_KNOWN_PEERS", "54.166.220.249:11625,44.223.45.116:11625,54.159.138.198:11625")
          type  = "GENERAL"
        }

        # User Service Base URL if provided
        env {
          key   = "USER_SERVICE_BASE_URL"
          value = lookup(var.testnet_backend_env, "USER_SERVICE_BASE_URL", "")
          type  = "GENERAL"
        }

        env {
          key   = "USER_SERVICE_USERNAME"
          value = lookup(var.testnet_backend_env, "USER_SERVICE_USERNAME", "")
          type  = "GENERAL"
        }

        # User Service Password if provided
        env {
          key   = "USER_SERVICE_PASSWORD"
          value = lookup(var.testnet_backend_env, "USER_SERVICE_PASSWORD", "")
          type  = "SECRET"
        }

        env {
          key   = "BACKEND_PORT"
          value = lookup(var.testnet_backend_env, "BACKEND_PORT", "3000")
          type  = "GENERAL"
        }

        http_port = lookup(var.testnet_backend_env, "BACKEND_PORT", 3000)

        health_check {
          http_path = "/health"
        }

        build_command = "pnpm build"
        run_command   = "pnpm start:api"
      }
    }

    # Users Service - conditionally deployed based on instance count
    dynamic "service" {
      for_each = var.users_instance_count > 0 ? [1] : []
      content {
        name               = "users"
        instance_count     = var.users_instance_count
        instance_size_slug = var.instance_size

        git {
          repo_clone_url = var.repo_url
          branch         = var.git_branch
        }

        # Environment variables - explicitly defined
        env {
          key   = "NODE_ENV"
          value = var.environment
        }

        env {
          key   = "FEATURE_FLAGS"
          value = jsonencode(var.feature_flags)
        }

        env {
          key   = "NODE_VERSION"
          value = "20.19.0"
        }

        env {
          key   = "PNPM_VERSION"
          value = "9.15.0"
        }

        # Use database connection string with doadmin user (already has all necessary permissions)
        env {
          key   = "DATABASE_URL"
          value = "postgres://${digitalocean_database_cluster.radar_db.user}:${digitalocean_database_cluster.radar_db.password}@${digitalocean_database_cluster.radar_db.host}:${digitalocean_database_cluster.radar_db.port}/${digitalocean_database_db.radar_users_db.name}?sslmode=no-verify"
          type  = "SECRET"
        }

        env {
          key   = "PORT"
          value = lookup(var.users_env, "PORT", "7000")
          type  = "GENERAL"
        }

        # JWT Secret if provided
        env {
          key   = "JWT_SECRET"
          value = lookup(var.users_env, "JWT_SECRET", "")
          type  = "SECRET"
        }

        # Mailgun Base URL if provided
        env {
          key   = "MAILGUN_BASE_URL"
          value = lookup(var.users_env, "MAILGUN_BASE_URL", "")
          type  = "GENERAL"
        }

        # Mailgun Secret Key if provided
        env {
          key   = "MAILGUN_SECRET"
          value = lookup(var.users_env, "MAILGUN_SECRET", "")
          type  = "SECRET"
        }

        # Mailgun Domain if provided
        env {
          key   = "MAILGUN_DOMAIN"
          value = lookup(var.users_env, "MAILGUN_DOMAIN", "")
          type  = "GENERAL"
        }

        # Mailgun From Address if provided
        env {
          key   = "MAILGUN_FROM"
          value = lookup(var.users_env, "MAILGUN_FROM", "")
          type  = "GENERAL"
        }

        # Sentry DSN if provided
        env {
          key   = "SENTRY_DSN"
          value = lookup(var.users_env, "SENTRY_DSN", "")
          type  = "SECRET"
        }

        # Consumer Secret if provided
        env {
          key   = "CONSUMER_SECRET"
          value = lookup(var.users_env, "CONSUMER_SECRET", "")
          type  = "SECRET"
        }

        # Encryption Secret if provided
        env {
          key   = "ENCRYPTION_SECRET"
          value = lookup(var.users_env, "ENCRYPTION_SECRET", "")
          type  = "SECRET"
        }

        # Hash Secret if provided
        env {
          key   = "HASH_SECRET"
          value = lookup(var.users_env, "HASH_SECRET", "")
          type  = "SECRET"
        }

        # Consumer Name if provided
        env {
          key   = "CONSUMER_NAME"
          value = lookup(var.users_env, "CONSUMER_NAME", "")
          type  = "GENERAL"
        }

        http_port = 7000

        health_check {
          http_path = "/health"
        }

        build_command = "corepack enable && corepack prepare pnpm@9.15.0 --activate && pnpm install && pnpm build:ts && pnpm --filter shared run post-build && pnpm --filter users run build && pnpm --filter users run post-build"
        run_command   = "pnpm --filter users start"
      }
    }

    # Using an external database instead of App Platform database

    # Ingress rules - conditionally included based on which services are deployed
    ingress {
      # Frontend routes - only included if frontend is deployed
      dynamic "rule" {
        for_each = var.frontend_instance_count > 0 ? [1] : []
        content {
          match {
            path {
              prefix = "/"
            }
          }
          component {
            name = "frontend"
          }
        }
      }

      # Backend routes - only included if backend is deployed
      dynamic "rule" {
        for_each = var.backend_instance_count > 0 ? [1] : []
        content {
          match {
            path {
              prefix = "/api"
            }
          }
          component {
            name = "backend"
          }
        }
      }

      # Testnet Backend routes - only included if testnet backend is deployed
      dynamic "rule" {
        for_each = var.testnet_backend_instance_count > 0 ? [1] : []
        content {
          match {
            path {
              prefix = "/testnet-api"
            }
          }
          component {
            name = "testnet-backend"
          }
        }
      }

      # Network Scanner is now a worker and doesn't need ingress rules

      # History Scanner is now a worker and doesn't need ingress rules

      # Users routes - only included if users service is deployed
      dynamic "rule" {
        for_each = var.users_instance_count > 0 ? [1] : []
        content {
          match {
            path {
              prefix = "/users"
            }
          }
          component {
            name = "users"
          }
        }
      }
    }
  }
}
