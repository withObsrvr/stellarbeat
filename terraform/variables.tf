variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "region" {
  description = "DigitalOcean region"
  type        = string
  default     = "nyc3"
}

variable "repo_url" {
  description = "Git repository URL"
  type        = string
}

# Database Configuration
variable "staging_database_url" {
  description = "Staging database connection URL"
  type        = string
  sensitive   = true
}

variable "integration_database_url" {
  description = "Integration database connection URL"
  type        = string
  sensitive   = true
}

variable "production_database_url" {
  description = "Production database connection URL"
  type        = string
  sensitive   = true
}

# Security
variable "staging_jwt_secret" {
  description = "JWT secret for staging environment"
  type        = string
  sensitive   = true
}

variable "integration_jwt_secret" {
  description = "JWT secret for integration environment"
  type        = string
  sensitive   = true
}

variable "production_jwt_secret" {
  description = "JWT secret for production environment"
  type        = string
  sensitive   = true
}

# API Keys
variable "staging_api_key" {
  description = "API key for staging environment"
  type        = string
  sensitive   = true
}

variable "integration_api_key" {
  description = "API key for integration environment"
  type        = string
  sensitive   = true
}

variable "production_api_key" {
  description = "API key for production environment"
  type        = string
  sensitive   = true
}

# AWS Configuration
variable "enable_s3_backup" {
  description = "Whether to enable S3 backup"
  type        = bool
  default     = false
}

variable "aws_access_key" {
  description = "AWS access key"
  type        = string
  sensitive   = true
}

variable "aws_bucket_name" {
  description = "AWS S3 bucket name"
  type        = string
}

variable "aws_secret_access_key" {
  description = "AWS secret access key"
  type        = string
  sensitive   = true
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-west-1"
}

# Database Configuration
variable "database_pool_size" {
  description = "Database connection pool size"
  type        = number
  default     = 10
}

# External Services
variable "ipstack_access_key" {
  description = "IPStack API access key"
  type        = string
  sensitive   = true
}

variable "deadman_url" {
  description = "Deadman switch URL"
  type        = string
}

variable "enable_heart_beat" {
  description = "Whether to enable heart beat"
  type        = bool
  default     = false
}

# Sentry Configuration
variable "enable_sentry" {
  description = "Whether to enable Sentry"
  type        = bool
  default     = false
}

variable "sentry_dsn" {
  description = "Sentry DSN"
  type        = string
  sensitive   = true
}

variable "sentry_environment" {
  description = "Sentry environment"
  type        = string
  default     = "development"
}

# Stellar Network Configuration
variable "horizon_url" {
  description = "Stellar Horizon URL"
  type        = string
  default     = "https://horizon.stellar.org"
}

variable "network_passphrase" {
  description = "Stellar network passphrase"
  type        = string
  default     = "Public Global Stellar Network ; September 2015"
}

variable "network_id" {
  description = "Stellar network ID"
  type        = string
  default     = "public"
}

variable "network_name" {
  description = "Stellar network name"
  type        = string
  default     = "Public Stellar Network"
}

variable "network_overlay_version" {
  description = "Stellar network overlay version"
  type        = number
  default     = 37
}

variable "network_ledger_version" {
  description = "Stellar network ledger version"
  type        = number
  default     = 22
}

variable "network_overlay_min_version" {
  description = "Stellar network overlay minimum version"
  type        = number
  default     = 35
}

variable "network_stellar_core_version" {
  description = "Stellar core version"
  type        = string
  default     = "22.2.0"
}

variable "network_quorum_set" {
  description = "Stellar network quorum set"
  type        = string
}

variable "network_known_peers" {
  description = "Stellar network known peers"
  type        = string
}

# Service Configuration
variable "database_test_url" {
  description = "Test database URL"
  type        = string
  sensitive   = true
}

variable "backend_port" {
  description = "Backend service port"
  type        = number
  default     = 3000
}

variable "user_agent" {
  description = "User agent string"
  type        = string
}

variable "crawler_max_connections" {
  description = "Maximum number of crawler connections"
  type        = number
  default     = 25
}

variable "crawler_max_crawl_time" {
  description = "Maximum crawler time in milliseconds"
  type        = number
  default     = 900000
}

variable "crawler_blacklist" {
  description = "Crawler blacklist"
  type        = string
  default     = ""
}

variable "notifications_enabled" {
  description = "Whether notifications are enabled"
  type        = bool
  default     = false
}

variable "user_service_base_url" {
  description = "User service base URL"
  type        = string
}

variable "user_service_username" {
  description = "User service username"
  type        = string
}

variable "user_service_password" {
  description = "User service password"
  type        = string
  sensitive   = true
}

variable "frontend_base_url" {
  description = "Frontend base URL"
  type        = string
}

variable "network_scan_loop_interval_ms" {
  description = "Network scan loop interval in milliseconds"
  type        = number
  default     = 180000
}

variable "history_scan_api_username" {
  description = "History scan API username"
  type        = string
}

variable "history_scan_api_password" {
  description = "History scan API password"
  type        = string
  sensitive   = true
}

variable "debug" {
  description = "Whether debug mode is enabled"
  type        = bool
  default     = true
} 