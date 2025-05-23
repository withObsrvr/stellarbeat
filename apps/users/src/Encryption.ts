import {
	randombytes_buf,
	crypto_secretbox_NONCEBYTES,
	crypto_secretbox_MACBYTES,
	crypto_secretbox_easy,
	crypto_secretbox_open_easy
} from 'sodium-native';

export class Encryption {
	constructor(protected secret: Buffer) {
		// Verify the secret is the correct length for sodium-native
		if (this.secret.length !== crypto_secretbox_KEYBYTES) {
			throw new Error(`Encryption secret must be exactly ${crypto_secretbox_KEYBYTES} bytes when decoded from base64. Current length: ${this.secret.length}`);
		}
	}

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

	decrypt(cypher: Buffer, nonce: Buffer): Buffer | Error {
		const message = Buffer.alloc(cypher.length - crypto_secretbox_MACBYTES);
		const success = crypto_secretbox_open_easy(
			message,
			cypher,
			nonce,
			this.secret
		);
		if (!success) return new Error('Forged message');

		return message;
	}
}
