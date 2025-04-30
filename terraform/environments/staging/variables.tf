variable "active_database_url" {
  description = "Active Database URL"
  type        = string
  sensitive   = true
}

variable "database_pool_size" {
  description = "Database connection pool size"
  type        = number
  default     = 10

}

variable "database_test_url" {
  description = "Test Database URL"
  type        = string
  sensitive   = true
}
variable "enable_s3_backup" {
  description = "Enable S3 backup"
  type        = bool
  default     = false
}

variable "aws_access_key" {
  description = "AWS Access Key"
  type        = string
  sensitive   = true
}
variable "aws_bucket_name" {
  description = "AWS Bucket Name"
  type        = string
}

variable "aws_secret_access_key" {
  description = "AWS Secret Access Key"
  type        = string
  sensitive   = true
}

variable "aws_region" {
  description = "AWS Region"
  type        = string
  default     = "eu-west-1"
}

variable "deadman_url" {
  description = "Deadman URL"
  type        = string
}

variable "enable_heart_beat" {
  description = "Enable heart beat"
  type        = bool
  default     = false
}

variable "enable_sentry" {
  description = "Enable Sentry"
  type        = bool
  default     = false
}
variable "sentry_dsn" {
  description = "Sentry DSN"
  type        = string
}
variable "sentry_environment" {
  description = "Sentry Environment"
  type        = string
  default     = "development"
}
variable "horizon_url" {
  description = "Horizon URL"
  type        = string
  default     = "https://horizon.stellar.org"
}
variable "network_passphrase" {
  description = "Network passphrase"
  type        = string
  default     = "Public Global Stellar Network ; September 2015"
}
variable "network_id" {
  description = "Network ID"
  type        = string
  default     = "public"
}
variable "network_name" {
  description = "Network name"
  type        = string
  default     = "Public Stellar Network"
}
variable "network_overlay_version" {
  description = "Network overlay version"
  type        = number
  default     = 37
}
variable "network_ledger_version" {
  description = "Network ledger version"
  type        = number
  default     = 22
}
variable "network_overlay_min_version" {
  description = "Network overlay minimum version"
  type        = number
  default     = 35
}
variable "network_stellar_core_version" {
  description = "Network Stellar Core version"
  type        = string
  default     = "22.2.0"
}

variable "network_quorum_set" {
  description = "Network quorum set"
  type        = string
  default     = "[['GCVJ4Z6TI6Z2SOGENSPXDQ2U4RKH3CNQKYUHNSSPYFPNWTLGS6EBH7I2','GCIXVKNFPKWVMKJKVK2V4NK7D4TC6W3BUMXSIJ365QUAXWBRPPJXIR2Z','GBLJNN3AVZZPG2FYAYTYQKECNWTQYYUUY2KVFN2OUKZKBULXIXBZ4FCT'],['GD5QWEVV4GZZTQP46BRXV5CUMMMLP4JTGFD7FWYJJWRL54CELY6JGQ63','GDXQB3OMMQ6MGG43PWFBZWBFKBBDUZIVSUDAZZTRAWQZKES2CDSE5HKJ','GCFONE23AB7Y6C5YZOMKUKGETPIAJA4QOYLS5VNS4JHBGKRZCPYHDLW7','GA7TEPCBDQKI7JQLQ34ZURRMK44DVYCIGVXQQWNSWAEQR6KB4FMCBT7J','GA5STBMV6QDXFDGD62MEHLLHZTPDI77U3PFOD2SELU5RJDHQWBR5NNK7'],['GCMSM2VFZGRPTZKPH5OABHGH4F3AVS6XTNJXDGCZ3MKCOSUBH3FL6DOB','GA7DV63PBUUWNUFAF4GAZVXU2OZMYRATDLKTC7VTCG7AU4XUPN5VRX4A','GARYGQ5F2IJEBCZJCBNPWNWVDOFK7IBOHLJKKSG2TMHDQKEEC6P4PE4V'],['GC5SXLNAM3C4NMGK2PXK4R34B5GNZ47FYQ24ZIBFDFOCU6D4KBN4POAE','GBJQUIXUO4XSNPAUT6ODLZUJRV2NPXYASKUB']]"
}



variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "region" {
  description = "DigitalOcean region to deploy to"
  type        = string
  default     = "nyc3"
}

variable "repo_url" {
  description = "URL of the Git repository"
  type        = string
}

variable "ipstack_access_key" {
  description = "API Key for IPStack"
  type        = string
}

variable "staging_api_key" {
  description = "API Key for Staging"
  type        = string
  sensitive   = true
}

variable "staging_jwt_secret" {
  description = "JWT Secret"
  type        = string
  sensitive   = true
}

variable "frontend_instance_count" {
  description = "Number of instances for the frontend service"
  type        = number
  default     = 1
}
variable "backend_instance_count" {
  description = "Number of instances for the backend service"
  type        = number
  default     = 1
}
variable "scanner_instance_count" {
  description = "Number of instances for the network scanner service"
  type        = number
  default     = 1
}
variable "users_instance_count" {
  description = "Number of instances for the users service"
  type        = number
  default     = 1
}
variable "instance_size" {
  description = "Size of the instances"
  type        = string
  default     = "basic-xs"
}
variable "environment" {
  description = "Environment name"
  type        = string
  default     = "staging"
}
variable "git_branch" {
  description = "Git branch to deploy"
  type        = string
  default     = "main"
}

variable "notifications_enabled" {
  description = "Enable notifications"
  type        = bool
  default     = false
}

variable "user_service_base_url" {
  description = "Base URL for the user service"
  type        = string
  default     = "localhost"
}

variable "network_known_peers" {
  description = "value of network_known_peers"
  type        = string
}

variable "backend_port" {
  description = "Port for the backend service"
  type        = number
  default     = 3000
}

variable "user_agent" {
  description = "User agent for the backend service"
  type        = string
  default     = "agent"
}

variable "crawler_max_connections" {
  description = "Maximum connections for the crawler"
  type        = number
  default     = 25
}

variable "crawler_max_crawl_time" {
  description = "Maximum crawl time for the crawler in milliseconds"
  type        = number
  default     = 900000
}

variable "crawler_blacklist" {
  description = "Blacklist for the crawler"
  type        = string
  default     = ""
}

variable "frontend_base_url" {
  description = "Base URL for the frontend service"
  type        = string
  default     = "localhost"
}

variable "user_service_username" {
  description = "Username for the user service"
  type        = string
  default     = "user"
}

variable "user_service_password" {
  description = "Password for the user service"
  type        = string
  default     = "password"
}

variable "network_scan_loop_interval_ms" {
  description = "Network scan loop interval in milliseconds"
  type        = number
  default     = 180000
}

variable "history_scan_api_username" {
  description = "Username for the history scan API"
  type        = string
  default     = "admin"
}

variable "history_scan_api_password" {
  description = "Password for the history scan API"
  type        = string
  default     = "password"
}

variable "debug" {
  description = "Enable debug mode"
  type        = bool
  default     = true
}

variable "mailgun_secret" {
  description = "Mailgun secret"
  type        = string
  sensitive   = true
}

variable "mailgun_domain" {
  description = "Mailgun domain"
  type        = string
}

variable "mailgun_from" {
  description = "Mailgun from address"
  type        = string
}

variable "mailgun_base_url" {
  description = "Mailgun base URL"
  type        = string
}
