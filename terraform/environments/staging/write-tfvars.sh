#!/usr/bin/env bash
# Generates terraform.auto.tfvars for the staging environment.
#
# Expects all secrets/variables to be available as environment variables.
# Called from CI workflows so the heredoc lives in exactly one place
# (shared between plan-staging and the destroy workflow).
#
# For values with defaults, bash parameter expansion is used:
#   ${VAR:-default}  → use VAR if set & non-empty, otherwise "default"
set -euo pipefail

cd "$(dirname "$0")"

cat > terraform.auto.tfvars <<EOF
# Core credentials
do_token                 = "${DIGITALOCEAN_ACCESS_TOKEN}"
git_branch               = "${GIT_BRANCH}"
deployed_sha             = "${DEPLOYED_SHA:-}"
region                   = "${REGION:-nyc3}"
aws_access_key           = "${AWS_ACCESS_KEY_ID}"
aws_secret_access_key    = "${AWS_SECRET_ACCESS_KEY}"
aws_region               = "${AWS_REGION}"
aws_bucket_name          = "${AWS_BUCKET_NAME:-stellarbeat-backup}"
repo_url                 = "${REPO_URL}"

# Environment specific
environment              = "staging"
app_api_key          = "${STAGING_API_KEY}"
app_jwt_secret       = "${STAGING_JWT_SECRET}"
app_url              = "${STAGING_DOMAIN}"
app_api_url          = "${STAGING_DOMAIN}"
domain_name              = "radar-staging.withobsrvr.com"

# Service credentials
ipstack_access_key       = "${IPSTACK_ACCESS_KEY}"
mailgun_secret           = "${MAILGUN_SECRET}"
mailgun_domain           = "${MAILGUN_DOMAIN:-mail.example.com}"
mailgun_from             = "${MAILGUN_FROM:-noreply@example.com}"
mailgun_base_url         = "${MAILGUN_BASE_URL:-https://api.mailgun.net}"
encryption_secret        = "${ENCRYPTION_SECRET}"
hash_secret              = "${HASH_SECRET}"
consumer_secret          = "${CONSUMER_SECRET}"
consumer_name            = "${CONSUMER_NAME:-}"

# Database configuration
database_pool_size       = ${DATABASE_POOL_SIZE:-10}
database_test_url        = "${DATABASE_TEST_URL}"

# Service configuration
enable_s3_backup         = false
enable_heart_beat        = false
enable_sentry            = false
notifications_enabled    = true
debug                    = ${DEBUG:-false}
sentry_dsn               = "${SENTRY_DSN:-}"
sentry_environment       = "staging"
deadman_url              = "${DEADMAN_URL:-}"

# API credentials
coordinator_api_username = "${COORDINATOR_API_USERNAME:-}"
coordinator_api_password = "${COORDINATOR_API_PASSWORD:-}"
coordinator_api_base_url = "${COORDINATOR_API_BASE_URL:-http://localhost:7000}"
history_scan_api_username = "${HISTORY_SCAN_API_USERNAME:-}"
history_scan_api_password = "${HISTORY_SCAN_API_PASSWORD:-}"
user_service_username    = "${USER_SERVICE_USERNAME:-}"
user_service_password    = "${USER_SERVICE_PASSWORD:-}"

# Infrastructure settings
instance_size            = "${INSTANCE_SIZE:-apps-s-1vcpu-1gb}"
history_scanner_instance_size = "${HISTORY_SCANNER_INSTANCE_SIZE:-apps-d-2vcpu-8gb}"
frontend_instance_count  = 1
backend_instance_count   = 1
scanner_instance_count   = 1
history_scanner_instance_count = 0
history_scanner_worker_count = ${HISTORY_SCANNER_WORKER_COUNT:-1}
users_instance_count     = 1

# Service configuration
backend_port             = 3000
user_agent               = "radar-agent"
history_scanner_user_agent = "radar-history-scanner"
crawler_max_connections  = 25
crawler_max_crawl_time   = 900000
crawler_blacklist        = "${CRAWLER_BLACKLIST:-test}"
network_scan_loop_interval_ms = 300000
user_service_base_url    = "${USER_SERVICE_BASE_URL:-http://localhost:7000}"
frontend_base_url        = "${FRONTEND_BASE_URL:-http://localhost:3000}"
users_port               = 7000
horizon_url             = "${HORIZON_URL:-https://horizon.stellar.org}"
network_passphrase        = "${NETWORK_PASSPHRASE:-Public Global Stellar Network ; September 2015}"
network_id               = "${NETWORK_ID:-public}"
network_name             = "${NETWORK_NAME:-Public Stellar Network}"
network_overlay_version   = "${NETWORK_OVERLAY_VERSION:-40}"
network_ledger_version       = "${NETWORK_LEDGER_VERSION:-25}"
network_overlay_min_version   = "${NETWORK_OVERLAY_MIN_VERSION:-35}"
network_stellar_core_version   = "${NETWORK_STELLAR_CORE_VERSION:-25.0.0}"
network_quorum_set   = "${NETWORK_QUORUM_SET:-}"
network_known_peers = "${NETWORK_KNOWN_PEERS:-}"
testnet_horizon_url             = "${TESTNET_HORIZON_URL:-https://horizon-testnet.stellar.org}"
testnet_network_passphrase        = "${TESTNET_NETWORK_PASSPHRASE:-Test SDF Network ; September 2015}"
testnet_network_id               = "${TESTNET_NETWORK_ID:-testnet}"
testnet_network_name             = "${TESTNET_NETWORK_NAME:-Stellar Testnet}"
testnet_network_overlay_version   = "${TESTNET_NETWORK_OVERLAY_VERSION:-40}"
testnet_network_ledger_version       = "${TESTNET_NETWORK_LEDGER_VERSION:-25}"
testnet_network_overlay_min_version   = "${TESTNET_NETWORK_OVERLAY_MIN_VERSION:-35}"
testnet_network_stellar_core_version   = "${TESTNET_NETWORK_STELLAR_CORE_VERSION:-25.0.0}"
testnet_network_quorum_set   = "${TESTNET_NETWORK_QUORUM_SET:-}"
testnet_network_known_peers = "${TESTNET_NETWORK_KNOWN_PEERS:-54.166.220.249:11625,44.223.45.116:11625,54.159.138.198:11625}"
EOF

echo "Wrote $(pwd)/terraform.auto.tfvars"
