terraform {
  backend "s3" {
    bucket = "tfstate-prod-s3-useast2"
    key    = "radar/production/digitalocean/terraform.tfstate"
    region = "us-east-2"
  }
}
