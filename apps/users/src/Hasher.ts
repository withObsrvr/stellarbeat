import { crypto_generichash, crypto_generichash_BYTES } from 'sodium-native';

export class Hasher {
	constructor(protected secret: Buffer) {
		// Verify the secret is the correct length for sodium-native
		if (this.secret.length !== 32) {
			throw new Error(`Hash secret must be exactly 32 bytes when decoded from base64. Current length: ${this.secret.length}`);
		}
	}

	hash(message: Buffer): Buffer {
		const hash = Buffer.alloc(crypto_generichash_BYTES);
		crypto_generichash(hash, message, this.secret);

		return hash;
	}
}
