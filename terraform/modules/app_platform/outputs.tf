output "app_id" {
  description = "The ID of the deployed application"
  value       = digitalocean_app.stellarbeat.id
}

output "app_url" {
  description = "The URL of the deployed application"
  value       = digitalocean_app.stellarbeat.live_url
}

output "frontend_url" {
  description = "The URL of the frontend service"
  value       = "${digitalocean_app.stellarbeat.live_url}/frontend"
}

output "backend_url" {
  description = "The URL of the backend service"
  value       = "${digitalocean_app.stellarbeat.live_url}/backend"
}

output "network_scanner_url" {
  description = "The URL of the network scanner service"
  value       = "${digitalocean_app.stellarbeat.live_url}/network-scanner"
}

output "history_scanner_url" {
  description = "The URL of the history scanner service"
  value       = "${digitalocean_app.stellarbeat.live_url}/history-scanner"
}

output "users_url" {
  description = "The URL of the users service"
  value       = "${digitalocean_app.stellarbeat.live_url}/users"
} 