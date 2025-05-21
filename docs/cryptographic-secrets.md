# Cryptographic Secrets in Radar

This document describes the cryptographic secrets used in the Radar platform, how to generate them correctly, and requirements for their proper use.

## Overview

Radar uses the `sodium-native` library for secure cryptographic operations, particularly in the Users service. The application requires specific types of cryptographic secrets that must be formatted correctly to ensure security and proper functionality.

## Required Cryptographic Secrets

The application uses several cryptographic secrets:

| Secret Name | Environment Variable | Purpose | Required Format |
|-------------|---------------------|---------|----------------|
| Encryption Secret | `ENCRYPTION_SECRET` | Encrypts sensitive data (e.g., email addresses) | 32-byte (256-bit) buffer, Base64 encoded |
| Hash Secret | `HASH_SECRET` | Creates secure lookups without exposing raw data | 32-byte (256-bit) buffer, Base64 encoded |
| Consumer Secret | `CONSUMER_SECRET` | Basic authentication for API access | String, no specific format requirement |
| JWT Secret | `APP_JWT_SECRET` | Signs JWT tokens for authentication | Strong random string, Base64 encoded recommended |

## Generating Secrets Correctly

### For Encryption and Hash Secrets

These secrets **MUST** be:
- Exactly 32 bytes (256 bits) in raw form
- Base64 encoded for storage in configuration files and environment variables

**Correct way to generate these secrets:**

```bash
# For encryption_secret
openssl rand -base64 32

# For hash_secret
openssl rand -base64 32
```

The output from these commands will be Base64 encoded strings that represent 32 bytes of random data. Example:

```
h7Kn1vY8W5EU02QXjd6/bpKUZWKUa5fmEbV7ThYnchQ=
```

### For JWT and API Keys

For JWT secrets and API keys, use:

```bash
# For app_jwt_secret (longer token)
openssl rand -base64 48

# For API keys (hex format)
openssl rand -hex 32
```

## Validation and Troubleshooting

### Validating Secret Length

To verify a Base64 encoded secret will decode to the required 32 bytes:

```bash
echo -n "your-base64-encoded-secret" | base64 -d | wc -c
```

This should output `32`. If it's not 32, the secret will not work with sodium-native functions.

### Common Error Messages

If you encounter these errors, the secrets are likely improperly formatted:

- `"k" must be crypto_secretbox_KEYBYTES bytes long` - The encryption_secret is not 32 bytes when decoded
- `error in sodium_malloc()` - Memory allocation issue, possibly related to incorrect key sizes
- `key must be crypto_generichash_KEYBYTES_MAX bytes or less` - The hash_secret is too large

## Implementation Details

In the application, the secrets are used in the following way:

```typescript
// Loading secrets from environment variables
const secretString = process.env.ENCRYPTION_SECRET;
if (!secretString) throw new Error('No encryption secret');
const secret = Buffer.from(secretString, 'base64');

const hashSecretString = process.env.HASH_SECRET;
if (!hashSecretString) throw new Error('No hash secret');
const hashSecret = Buffer.from(hashSecretString, 'base64');

// Initializing encryption and hashing services
const encryption = new Encryption(secret);
const hasher = new Hasher(hashSecret);
```

The Encryption class uses sodium-native's secretbox for secure symmetric encryption:

```typescript
// Encryption.ts
encrypt(message: Buffer): {
    cipher: Buffer;
    nonce: Buffer;
} {
    const nonce = Buffer.alloc(crypto_secretbox_NONCEBYTES);
    randombytes_buf(nonce);

    const ciphertext = Buffer.alloc(message.length + crypto_secretbox_MACBYTES);
    crypto_secretbox_easy(ciphertext, message, nonce, this.secret);

    return {
        cipher: ciphertext,
        nonce: nonce
    };
}
```

The Hasher class uses sodium-native's generichash for secure hashing:

```typescript
// Hasher.ts
hash(message: Buffer): Buffer {
    const hash = Buffer.alloc(crypto_generichash_BYTES);
    crypto_generichash(hash, message, this.secret);

    return hash;
}
```

## Environment Configuration

Secrets should be stored in environment variables or secure configuration systems:

1. For local development, use a `.env` file (not checked into version control)
2. For production, use environment secrets through CI/CD and container configurations
3. For Terraform deployments, set these values in your terraform.tfvars or through secret management systems

## Security Best Practices

1. **Never reuse secrets** across different environments (development, staging, production)
2. **Rotate secrets** periodically according to your security policy
3. **Limit access** to the production secrets to only those who need them
4. **Never commit secrets** to version control, even in example or template files
5. **Use separate secrets** for different functions (encryption, hashing, etc.)

## Example Configuration

A correctly set up configuration for the Users service might look like:

```ini
# Users Service Configuration
MAILGUN_SECRET    = "api-key-from-mailgun"
MAILGUN_DOMAIN    = "mg.yourdomain.com"
MAILGUN_FROM      = "notify@yourdomain.com"
MAILGUN_BASE_URL  = "https://api.mailgun.net/v3/mg.yourdomain.com"
ENCRYPTION_SECRET = "h7Kn1vY8W5EU02QXjd6/bpKUZWKUa5fmEbV7ThYnchQ="
HASH_SECRET       = "PQkL92jfEWpkZdLE5Xv7oDNMzplboJr/OquNFMaFY3A="
CONSUMER_SECRET   = "AhTe8fooBar4092rWFxYbGzbJpqAmZ"
CONSUMER_NAME     = "servicename"
```

## References

- [sodium-native Documentation](https://github.com/sodium-friends/sodium-native)
- [Node.js Buffer Documentation](https://nodejs.org/api/buffer.html)
- [Base64 Encoding Documentation](https://en.wikipedia.org/wiki/Base64)