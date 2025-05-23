output "app_id" {
  description = "The ID of the deployed application"
  value       = digitalocean_app.radar.id
}

output "app_url" {
  description = "The URL of the deployed application"
  value       = digitalocean_app.radar.live_url
}

output "frontend_url" {
  description = "The URL of the frontend service"
  value       = "${digitalocean_app.radar.live_url}/"
}

output "backend_url" {
  description = "The URL of the backend service"
  value       = "${digitalocean_app.radar.live_url}/api/v1"
}

output "network_scanner_url" {
  description = "The URL of the network scanner service"
  value       = "${digitalocean_app.radar.live_url}/network-scanner"
}

output "history_scanner_url" {
  description = "The URL of the history scanner service"
  value       = "${digitalocean_app.radar.live_url}/history-scanner"
}

output "users_url" {
  description = "The URL of the users service"
  value       = "${digitalocean_app.radar.live_url}/users"
}

# Database outputs
output "database_cluster_id" {
  value       = digitalocean_database_cluster.radar_db.id
  description = "The ID of the database cluster"
}

output "database_name" {
  value       = digitalocean_database_db.radar_db.name
  description = "The name of the database"
}

output "database_host" {
  value       = digitalocean_database_cluster.radar_db.host
  description = "The host of the database cluster"
  sensitive   = true
}

output "database_port" {
  value       = digitalocean_database_cluster.radar_db.port
  description = "The port of the database cluster"
}

output "database_user" {
  value       = digitalocean_database_cluster.radar_db.user
  description = "The database admin user (doadmin)"
}

output "database_connection_string" {
  value       = "postgres://${digitalocean_database_cluster.radar_db.user}:${digitalocean_database_cluster.radar_db.password}@${digitalocean_database_cluster.radar_db.host}:${digitalocean_database_cluster.radar_db.port}/${digitalocean_database_db.radar_db.name}?sslmode=no-verify"
  description = "The connection string for the database"
  sensitive   = true
}
