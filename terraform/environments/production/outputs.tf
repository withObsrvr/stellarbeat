output "app_url" {
  description = "URL of the production environment"
  value       = module.app_platform.app_url
}

output "frontend_url" {
  description = "URL of the production frontend service"
  value       = module.app_platform.frontend_url
}

output "backend_url" {
  description = "URL of the production backend service"
  value       = module.app_platform.backend_url
}

output "network_scanner_url" {
  description = "URL of the production network scanner service"
  value       = module.app_platform.network_scanner_url
}

output "history_scanner_url" {
  description = "URL of the production history scanner service"
  value       = module.app_platform.history_scanner_url
}

output "users_url" {
  description = "URL of the production users service"
  value       = module.app_platform.users_url
}