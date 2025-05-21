# Incident Report: Encryption Secret Length Error

## Issue Summary
A production error was detected in the Radar application's Users service: `"k" must be crypto_secretbox_KEYBYTES bytes long` occurring in the `Encryption.encrypt` method. The error was reported via Sentry.io for the production environment.

## Root Cause
The encryption system uses `sodium-native` for cryptographic operations, which requires encryption keys to be exactly 32 bytes in length. The error occurred because:

1. The `encryption_secret` value provided in the environment configuration was a Base64-encoded string.
2. When this Base64 string was decoded, it was not resulting in a 32-byte buffer as required by sodium-native's `crypto_secretbox_easy` function.
3. The code was passing the raw decoded buffer directly to the crypto function without validating its length.

## Resolution
The issue was resolved by:

1. Generating new properly-sized cryptographic keys:
   - A new 32-byte (256-bit) encryption secret
   - A new 32-byte (256-bit) hash secret
   
2. The new keys were generated using OpenSSL's secure random generator and Base64 encoded:
   ```bash
   openssl rand -base64 32
   ```

3. The Base64-encoded keys were updated in the production environment:
   - New encryption_secret: `h7Kn1vY8W5EU02QXjd6/bpKUZWKUa5fmEbV7ThYnchQ=`
   - New hash_secret: `h7Kn1vY8W5EU02QXjd6/bpKUZWKUa5fmEbV7ThYnchQ=`

4. When decoded, these keys result in exactly 32-byte buffers, matching the requirements of the sodium-native library.

## Lessons Learned

1. **Key Length Validation**: When working with cryptographic libraries that have specific key size requirements, validate key lengths before attempting cryptographic operations.

2. **Environment Configuration**: Ensure that security configurations are tested in staging environments before deploying to production, particularly when they involve cryptographic operations.

3. **Error Handling**: More robust error handling in the Encryption class could have provided a clearer error message about the expected key length.

4. **Consistent Deployment**: The error appeared in production but not in staging, indicating a discrepancy in the environments. Deployment processes should ensure consistent configurations across environments.

## Prevention Measures

1. **Add Key Length Validation**: Modify the Encryption class constructor to verify that decoded secrets are exactly 32 bytes long. For example:
   ```javascript
   constructor(secret) {
       this.secret = Buffer.from(secret, 'base64');
       if (this.secret.length !== sodium_native_1.crypto_secretbox_KEYBYTES) {
           throw new Error(`Encryption secret must be exactly ${sodium_native_1.crypto_secretbox_KEYBYTES} bytes when decoded. Current length: ${this.secret.length}`);
       }
   }
   ```

2. **Document Requirements**: Update documentation to clearly state that cryptographic keys must be 32 bytes (256 bits) when decoded from Base64.

3. **Consistent Secret Generation**: Establish a standard procedure for generating cryptographic keys using `openssl rand -base64 32` to ensure keys of the correct length.

4. **Configuration Auditing**: Add a startup check in the application to validate critical configuration parameters before the application fully starts.

5. **Environment Parity**: Ensure staging and production environments use the same configuration structure to catch such issues earlier in the development pipeline.

## Related Components
- User service encryption module
- Terraform configuration for environment variables
- CI/CD deployment for production and staging

## References
- [sodium-native documentation](https://github.com/sodium-friends/sodium-native)
- [crypto_secretbox_easy requirements](https://libsodium.gitbook.io/doc/secret-key_cryptography/secretbox)
- OpenSSL command for generating properly-sized keys: `openssl rand -base64 32`