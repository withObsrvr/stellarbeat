terraform {
  required_providers {
    digitalocean = {
      source = "digitalocean/digitalocean"
    }
  }
}

resource "digitalocean_app" "stellarbeat" {
  spec {
    name   = var.app_name
    region = var.region

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

        # Database URL if provided
        env {
          key   = "ACTIVE_DATABASE_URL"
          value = lookup(var.backend_env, "ACTIVE_DATABASE_URL", "")
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

        http_port = lookup(var.backend_env, "BACKEND_PORT", 3000)

        health_check {
          http_path = "/health"
        }

        build_command = "pnpm build"
        run_command   = "pnpm start:api"
      }
    }

    # Network Scanner Service - conditionally deployed based on instance count
    dynamic "service" {
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

        # Database URL if provided
        env {
          key   = "ACTIVE_DATABASE_URL"
          value = lookup(var.network_scanner_env, "ACTIVE_DATABASE_URL", "")
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

        http_port = 5000

        health_check {
          http_path = "/health"
        }
        build_command = "pnpm build"
        run_command   = "pnpm start:scan-network"
      }
    }

    # History Scanner Service - conditionally deployed based on instance count
    dynamic "service" {
      for_each = var.scanner_instance_count > 0 ? [1] : []
      content {
        name               = "history-scanner"
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

        # Database URL if provided
        env {
          key   = "ACTIVE_DATABASE_URL"
          value = lookup(var.history_scanner_env, "ACTIVE_DATABASE_URL", "")
          type  = "SECRET"
        }

        # API Key if provided
        env {
          key   = "API_KEY"
          value = lookup(var.history_scanner_env, "API_KEY", "")
          type  = "SECRET"
        }

        http_port = 6000

        health_check {
          http_path = "/health"
        }
        build_command = "pnpm build"
        run_command   = "pnpm start:scan-history"
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

        # Database URL if provided
        env {
          key   = "ACTIVE_DATABASE_URL"
          value = lookup(var.users_env, "ACTIVE_DATABASE_URL", "")
          type  = "SECRET"
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

        http_port = 7000

        health_check {
          http_path = "/health"
        }

        build_command = "corepack enable && corepack prepare pnpm@9.15.0 --activate && pnpm install && pnpm build:ts && pnpm --filter shared run post-build && pnpm --filter users run post-build && pnpm --filter users build"
        run_command   = "node apps/users/lib/index.js"
      }
    }

    # Database
    database {
      name       = "stellarbeat-db"
      engine     = "PG"
      production = var.database_production
    }

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

      # Network Scanner routes - only included if network-scanner is deployed
      dynamic "rule" {
        for_each = var.scanner_instance_count > 0 ? [1] : []
        content {
          match {
            path {
              prefix = "/network-scanner"
            }
          }
          component {
            name = "network-scanner"
          }
        }
      }

      # History Scanner routes - only included if history-scanner is deployed
      dynamic "rule" {
        for_each = var.scanner_instance_count > 0 ? [1] : []
        content {
          match {
            path {
              prefix = "/history-scanner"
            }
          }
          component {
            name = "history-scanner"
          }
        }
      }

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
