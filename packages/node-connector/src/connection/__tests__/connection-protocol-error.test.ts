import { classifyOverlayFrameHeader } from '../connection-protocol-error';

describe('classifyOverlayFrameHeader', () => {
	it('detects a TLS record without retaining payload data', () => {
		const result = classifyOverlayFrameHeader(
			Buffer.from([0x15, 0x03, 0x01, 0x00])
		);

		expect(result?.code).toBe('OVERLAY_TLS_DETECTED');
		expect(result?.message).toBe(
			'TLS traffic detected on the Stellar overlay port'
		);
	});

	it('detects an HTTP response', () => {
		const result = classifyOverlayFrameHeader(Buffer.from('HTTP'));

		expect(result?.code).toBe('OVERLAY_HTTP_DETECTED');
	});

	it('rejects an unreasonable overlay frame length', () => {
		const result = classifyOverlayFrameHeader(
			Buffer.from([0x7f, 0xff, 0xff, 0xff])
		);

		expect(result?.code).toBe('OVERLAY_INVALID_FRAME');
	});

	it('accepts a plausible Stellar record marker', () => {
		const header = Buffer.alloc(4);
		header.writeUInt32BE(128);

		expect(classifyOverlayFrameHeader(header)).toBeNull();
	});
});
