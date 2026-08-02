import {
	classifyConnectionError,
	sanitizeConnectionErrorDetail
} from '../connection-attempt';

describe('connection attempt diagnostics', () => {
	it('distinguishes a TCP timeout from an overlay timeout', () => {
		const error = Object.assign(new Error('timed out'), { code: 'ETIMEDOUT' });

		expect(classifyConnectionError(error, false, false)).toEqual(
			expect.objectContaining({ outcome: 'tcp_timeout', failureStage: 'tcp' })
		);
		expect(classifyConnectionError(error, true, false)).toEqual(
			expect.objectContaining({
				outcome: 'overlay_auth_failed',
				failureStage: 'overlay_hello'
			})
		);
	});

	it('sanitizes and bounds diagnostic details', () => {
		const detail = sanitizeConnectionErrorDetail(`secret\n${'x'.repeat(300)}`);

		expect(detail).not.toContain('\n');
		expect(detail.length).toBeLessThanOrEqual(240);
	});
});
