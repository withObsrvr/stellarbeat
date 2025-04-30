output "app_url" {
  description = "URL of the production environment"
  value       = module.app.app_url
}

output "frontend_url" {
  description = "URL of the production frontend service"
  value       = module.app.frontend_url
}

output "backend_url" {
  description = "URL of the production backend service"
  value       = module.app.backend_url
}

output "network_scanner_url" {
  description = "URL of the production network scanner service"
  value       = module.app.network_scanner_url
}

output "history_scanner_url" {
  description = "URL of the production history scanner service"
  value       = module.app.history_scanner_url
}

output "users_url" {
  description = "URL of the production users service"
  value       = module.app.users_url
} 