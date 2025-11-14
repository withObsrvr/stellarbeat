# No longer needed as we're using the managed database

variable "database_pool_size" {
  description = "Database connection pool size"
  type        = number
  default     = 25

}

variable "database_test_url" {
  description = "Test Database URL"
  type        = string
  sensitive   = true
}

variable "database_version_postgres" {
  description = "PostgreSQL version"
  type        = string
  default     = "17"
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
  default     = 38
}
variable "network_ledger_version" {
  description = "Network ledger version"
  type        = number
  default     = 24
}
variable "network_overlay_min_version" {
  description = "Network overlay minimum version"
  type        = number
  default     = 35
}
variable "network_stellar_core_version" {
  description = "Network Stellar Core version"
  type        = string
  default     = "24.0.0"
}

variable "network_quorum_set" {
  description = "Network quorum set"
  type        = string
  default     = "[['GCVJ4Z6TI6Z2SOGENSPXDQ2U4RKH3CNQKYUHNSSPYFPNWTLGS6EBH7I2','GCIXVKNFPKWVMKJKVK2V4NK7D4TC6W3BUMXSIJ365QUAXWBRPPJXIR2Z','GBLJNN3AVZZPG2FYAYTYQKECNWTQYYUUY2KVFN2OUKZKBULXIXBZ4FCT'],['GD5QWEVV4GZZTQP46BRXV5CUMMMLP4JTGFD7FWYJJWRL54CELY6JGQ63','GDXQB3OMMQ6MGG43PWFBZWBFKBBDUZIVSUDAZZTRAWQZKES2CDSE5HKJ','GCFONE23AB7Y6C5YZOMKUKGETPIAJA4QOYLS5VNS4JHBGKRZCPYHDLW7','GA7TEPCBDQKI7JQLQ34ZURRMK44DVYCIGVXQQWNSWAEQR6KB4FMCBT7J','GA5STBMV6QDXFDGD62MEHLLHZTPDI77U3PFOD2SELU5RJDHQWBR5NNK7'],['GCMSM2VFZGRPTZKPH5OABHGH4F3AVS6XTNJXDGCZ3MKCOSUBH3FL6DOB','GA7DV63PBUUWNUFAF4GAZVXU2OZMYRATDLKTC7VTCG7AU4XUPN5VRX4A','GARYGQ5F2IJEBCZJCBNPWNWVDOFK7IBOHLJKKSG2TMHDQKEEC6P4PE4V'],['GC5SXLNAM3C4NMGK2PXK4R34B5GNZ47FYQ24ZIBFDFOCU6D4KBN4POAE','GBJQUIXUO4XSNPAUT6ODLZUJRV2NPXYASKUB']]"
}

variable "testnet_horizon_url" {
  description = "Testnet Horizon URL"
  type        = string
  default     = "https://horizon-testnet.stellar.org"
}

variable "testnet_network_passphrase" {
  description = "Testnet Network passphrase"
  type        = string
  default     = "Test SDF Network ; September 2015"
}

variable "testnet_network_id" {
  description = "Testnet Network ID"
  type        = string
  default     = "testnet"
}

variable "testnet_network_name" {
  description = "Testnet Network name"
  type        = string
  default     = "Stellar Testnet"
}

variable "testnet_network_overlay_version" {
  description = "Testnet Network overlay version"
  type        = number
  default     = 37
}

variable "testnet_network_ledger_version" {
  description = "Testnet Network ledger version"
  type        = number
  default     = 22
}

variable "testnet_network_overlay_min_version" {
  description = "Testnet Network overlay minimum version"
  type        = number
  default     = 35
}

variable "testnet_network_stellar_core_version" {
  description = "Testnet Network Stellar Core version"
  type        = string
  default     = "22.2.0"
}

variable "testnet_network_quorum_set" {
  description = "Testnet Network quorum set"
  type        = string
  default     = "[['GDKXE2OZMJIPOSLNA6N6F2BVCI3O777I2OOC4BV7VOYUEHYX7RTRYA7Y','GC2V2EFSXN6SQTWVYA5EPJPBWWIMSD2XQNKUOHGEKB535AQE2I6IXV2Z','GCUCJTIYXSOXKBSNFGNFWW5MUQ54HKRPGJUTQFJ5RQXZXNOLNXYDHRAP']]"
}

variable "testnet_network_known_peers" {
  description = "value of testnet_network_known_peers"
  type        = string
  default     = "54.166.220.249:11625,44.223.45.116:11625,54.159.138.198:11625"
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

variable "app_api_key" {
  description = "API Key for App"
  type        = string
  sensitive   = true
}

variable "app_api_url" {
  description = "API URL for App"
  type        = string
}
variable "app_url" {
  description = "URL for App"
  type        = string
}

variable "app_jwt_secret" {
  description = "JWT Secret"
  type        = string
  sensitive   = true
}

variable "coordinator_api_username" {
  description = "Coordinator username"
  type        = string
  default     = "admin"
}

variable "coordinator_api_password" {
  description = "Coordinator password"
  type        = string
  default     = "password"
}

variable "history_scanner_user_agent" {
  description = "User agent for the history scanner"
  type        = string
  default     = "radar-history-scanner"
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

variable "history_scanner_instance_count" {
  description = "Number of instances for the history scanner service"
  type        = number
  default     = 1
}

variable "history_scanner_instance_size" {
  description = "Size of the history scanner instances"
  type        = string
  default     = "apps-d-2vcpu-8gb"
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
  default     = "production"
}
variable "git_branch" {
  description = "Git branch to deploy"
  type        = string
  default     = "main"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "radar.withobsrvr.com"
}

variable "notifications_enabled" {
  description = "Enable notifications"
  type        = bool
  default     = true
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
  default     = 50
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
  default     = 300000
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


variable "encryption_secret" {
  description = "value of encryption_secret"
  type        = string
}

variable "hash_secret" {
  description = "value of hash_secret"
  type        = string
}

variable "consumer_secret" {
  description = "value of consumer_secret"
  type        = string
}

variable "consumer_name" {
  description = "value of consumer_name"
  type        = string
  default     = "consumer"
}

variable "users_port" {
  description = "Port for the users service"
  type        = number
  default     = 7000
}
