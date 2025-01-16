import { crypto_generichash, crypto_generichash_BYTES } from 'sodium-native';

export class Hasher {
	constructor(protected secret: Buffer) {}

	hash(message: Buffer): Buffer {
		const hash = Buffer.alloc(crypto_generichash_BYTES);
		crypto_generichash(hash, message, this.secret);

		return hash;
	}
}
