terraform {
  backend "s3" {
    bucket = "tfstate-prod-s3-useast2"
    key    = "stellarbeat/staging/digitalocean/terraform.tfstate"
    region = "us-east-2"
  }
}