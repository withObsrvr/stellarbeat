# Python FBAS Service - Terraform Deployment Guide

This guide documents how to deploy the Python FBAS service to production using Terraform on DigitalOcean App Platform.

## Overview

The Python FBAS service has been added to the Terraform module configuration. It removes the tier 1 organization cap limitation that exists in the Rust scanner, enabling more accurate FBAS analysis for larger networks.

## Module Changes (Already Complete)

The following changes have been made to `terraform/modules/app_platform/`:

1. **variables.tf**: Added `python_fbas_instance_count` and `python_fbas_env` variables
2. **main.tf**:
   - Added Python FBAS service definition using Dockerfile deployment
   - Added `ENABLE_PYTHON_FBAS` and `PYTHON_FBAS_SERVICE_URL` environment variables to network scanner workers
   - Added the same environment variables to testnet scanner workers

## Environment-Specific Configuration

To enable the Python FBAS service in a specific environment (staging, production, integration), you need to update the environment's `main.tf` file.

### Required Changes

Add the following to the module block in `terraform/environments/{environment}/main.tf`:

#### 1. Add instance count

```hcl
module "app_platform" {
  source = "../../modules/app_platform"

  # ... existing configuration ...

  # Add this line to enable Python FBAS service (1 instance recommended)
  python_fbas_instance_count = 1

  # ... rest of configuration ...
}
```

#### 2. Add environment variables (optional)

If you need to configure environment variables for the Python FBAS service, add:

```hcl
  # Python FBAS service environment variables (optional)
  python_fbas_env = {
    LOG_LEVEL = "info"
    # Add any other environment variables as needed
  }
```

### Example: Staging Environment

Here's what the changes look like for `terraform/environments/staging/main.tf`:

```hcl
module "app_platform" {
  source = "../../modules/app_platform"

  app_name    = "radar-staging"
  region      = var.region
  repo_url    = var.repo_url
  domain_name = var.domain_name
  git_branch  = var.git_branch

  environment                   = "staging"
  instance_size                 = "apps-s-1vcpu-1gb"
  history_scanner_instance_size = "apps-d-2vcpu-8gb"

  frontend_instance_count        = 1
  backend_instance_count         = 1
  testnet_backend_instance_count = 0
  scanner_instance_count         = 0
  testnet_scanner_instance_count = 0
  history_scanner_instance_count = 0
  users_instance_count           = 0
  python_fbas_instance_count     = 1  # <-- ADD THIS LINE

  database_production = true

  feature_flags = {
    experimentalFeatures = false
    betaFeatures         = false
  }

  # ... existing environment variables ...

  # Python FBAS environment variables (optional)
  python_fbas_env = {
    # Add any custom configuration here if needed
  }
}
```

### Example: Production Environment

For production, follow the same pattern in `terraform/environments/production/main.tf`:

```hcl
module "app_platform" {
  # ... existing configuration ...

  python_fbas_instance_count = 1  # Enable Python FBAS service

  # Optional: Python FBAS environment variables
  python_fbas_env = {
    LOG_LEVEL = "info"
  }
}
```

## How It Works

### Service Architecture

1. **Python FBAS Service** (`python-fbas`):
   - Runs as a containerized service using Dockerfile from `python-fbas-service/`
   - Exposes HTTP API on port 8080
   - Health check endpoint: `/health`
   - Internal URL: `http://python-fbas:8080`

2. **Network Scanner Worker**:
   - Automatically configured with:
     - `ENABLE_PYTHON_FBAS=true` when `python_fbas_instance_count > 0`
     - `PYTHON_FBAS_SERVICE_URL=http://python-fbas:8080`
   - Falls back to Rust scanner if Python FBAS service fails

### Conditional Deployment

The Python FBAS service is conditionally deployed based on the instance count:
- Set `python_fbas_instance_count = 0` to disable (scanner uses Rust-only)
- Set `python_fbas_instance_count = 1` to enable (scanner uses Python with Rust fallback)

### Environment Variables Passed to Scanners

When Python FBAS service is deployed (`python_fbas_instance_count > 0`):
```
ENABLE_PYTHON_FBAS=true
PYTHON_FBAS_SERVICE_URL=http://python-fbas:8080
```

When Python FBAS service is NOT deployed (`python_fbas_instance_count = 0`):
```
ENABLE_PYTHON_FBAS=false
PYTHON_FBAS_SERVICE_URL=
```

## Deployment Steps

1. **Update environment configuration**: Edit the appropriate `terraform/environments/{environment}/main.tf` file
2. **Review changes**: Run `terraform plan` to review the changes
3. **Apply changes**: Run `terraform apply` to deploy the Python FBAS service
4. **Verify deployment**:
   - Check that the `python-fbas` service is running in DigitalOcean App Platform
   - Verify the health check is passing: `http://python-fbas:8080/health`
   - Monitor network scanner logs to confirm Python FBAS is being used

## Monitoring

### Health Checks

The Python FBAS service includes a health check at `/health` that returns:
```json
{
  "status": "healthy"
}
```

### Scanner Logs

Monitor the network scanner logs for these messages:
- `"Using Python FBAS scanner (removes tier 1 org cap)"` - Python scanner is active
- `"Python FBAS analysis succeeded"` - Python analysis completed successfully
- `"Python FBAS analysis failed, falling back to Rust scanner"` - Fallback occurred
- `"Using Rust FBAS scanner"` - Using Rust scanner (Python disabled or failed)

## Rollback

To disable the Python FBAS service:

1. Set `python_fbas_instance_count = 0` in the environment's main.tf
2. Run `terraform apply`
3. The scanner will automatically use the Rust scanner instead

The rollback is safe because the backend is designed with graceful fallback from Python to Rust scanner.

## Resource Requirements

Recommended instance size: `apps-s-1vcpu-1gb` (same as other services)

The Python FBAS service:
- Uses QBF solver for top tier analysis
- Memory-efficient for typical Stellar network sizes
- Scales horizontally if needed (though 1 instance is typically sufficient)

## Notes

- The Python FBAS service uses the Dockerfile in `python-fbas-service/Dockerfile`
- Docker image is built automatically by DigitalOcean App Platform during deployment
- The service does not require database access
- Internal service-to-service communication uses `http://python-fbas:8080`
- The service is not exposed to the public internet (no ingress route configured)
