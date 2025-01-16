import {
	crypto_generichash_KEYBYTES,
	crypto_secretbox_KEYBYTES, randombytes_buf,
	sodium_malloc
} from 'sodium-native';
import { Encryption } from '../Encryption';
import { Hasher } from '../Hasher';

const key = sodium_malloc(crypto_secretbox_KEYBYTES); // secure buffer
randombytes_buf(key);
const message = 'home@home.com';
const messageBuffer = Buffer.from(message);

const encryption = new Encryption(key);
const { cipher, nonce } = encryption.encrypt(messageBuffer);

const decryptedMessage = encryption.decrypt(cipher, nonce);
if (decryptedMessage.toString() !== message)
	throw new Error('Encryption and decryption failed');

console.log('Encryption/decryption succeeded');

const hashKey = sodium_malloc(crypto_generichash_KEYBYTES);
const hashManager = new Hasher(hashKey);
const hash = hashManager.hash(messageBuffer);

if (hash.toString('base64') !== 'pqu+ZaVfVvhYDvdv6moTJKH2K63dIm999zrprpEnV8w=')
	throw new Error('Hashing failed');

console.log('Hashing succeeded');

