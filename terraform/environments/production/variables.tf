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