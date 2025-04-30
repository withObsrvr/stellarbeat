variable "app_name" {
  description = "Name of the application"
  type        = string
}

variable "region" {
  description = "DigitalOcean region"
  type        = string
}

variable "repo_url" {
  description = "Git repository URL"
  type        = string
}

variable "git_branch" {
  description = "Git branch to deploy"
  type        = string
}

variable "environment" {
  description = "Environment name (staging, integration, production)"
  type        = string
}

variable "instance_size" {
  description = "Instance size slug"
  type        = string
}

variable "frontend_instance_count" {
  description = "Number of frontend instances"
  type        = number
}

variable "backend_instance_count" {
  description = "Number of backend instances"
  type        = number
}

variable "scanner_instance_count" {
  description = "Number of scanner instances"
  type        = number
}

variable "users_instance_count" {
  description = "Number of users service instances"
  type        = number
}

variable "database_production" {
  description = "Whether to use production database"
  type        = bool
}

variable "feature_flags" {
  description = "Feature flags configuration"
  type        = map(bool)
}

# Environment variables for each service
variable "frontend_env" {
  description = "Environment variables for frontend service"
  type        = map(string)
  default     = {}
  sensitive   = true
}

variable "backend_env" {
  description = "Environment variables for backend service"
  type        = map(string)
  default     = {}
  sensitive   = true
}

variable "network_scanner_env" {
  description = "Environment variables for network scanner service"
  type        = map(string)
  default     = {}
  sensitive   = true
}

variable "history_scanner_env" {
  description = "Environment variables for history scanner service"
  type        = map(string)
  default     = {}
  sensitive   = true
}

variable "users_env" {
  description = "Environment variables for users service"
  type        = map(string)
  default     = {}
  sensitive   = true
} 