import { isIP } from 'net';

export function isPublicIpAddress(ip: string): boolean {
	const family = isIP(ip);
	if (family === 0) return false;
	if (family === 6) {
		const normalized = ip.toLowerCase();
		return !(
			normalized === '::1' ||
			normalized === '::' ||
			normalized.startsWith('fc') ||
			normalized.startsWith('fd') ||
			normalized.startsWith('fe8') ||
			normalized.startsWith('fe9') ||
			normalized.startsWith('fea') ||
			normalized.startsWith('feb')
		);
	}

	const [a, b] = ip.split('.').map(Number);
	return !(
		a === 0 ||
		a === 10 ||
		a === 127 ||
		(a === 169 && b === 254) ||
		(a === 172 && b >= 16 && b <= 31) ||
		(a === 192 && b === 168) ||
		(a === 100 && b >= 64 && b <= 127) ||
		a >= 224
	);
}
