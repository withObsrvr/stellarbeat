export type ConnectionProtocolErrorCode =
	| 'OVERLAY_TLS_DETECTED'
	| 'OVERLAY_HTTP_DETECTED'
	| 'OVERLAY_INVALID_FRAME'
	| 'OVERLAY_WRONG_NETWORK'
	| 'OVERLAY_PROTOCOL_INCOMPATIBLE';

export class ConnectionProtocolError extends Error {
	constructor(
		public readonly code: ConnectionProtocolErrorCode,
		message: string
	) {
		super(message);
		this.name = ConnectionProtocolError.name;
	}
}

const MAX_OVERLAY_FRAME_BYTES = 16 * 1024 * 1024;

export function classifyOverlayFrameHeader(
	header: Buffer
): ConnectionProtocolError | null {
	if (header.length < 4) return null;

	const firstByteWithoutRecordMarker = header[0] & 0x7f;
	const isTlsRecord =
		firstByteWithoutRecordMarker >= 0x14 &&
		firstByteWithoutRecordMarker <= 0x17 &&
		header[1] === 0x03 &&
		header[2] <= 0x04;
	if (isTlsRecord) {
		return new ConnectionProtocolError(
			'OVERLAY_TLS_DETECTED',
			'TLS traffic detected on the Stellar overlay port'
		);
	}

	if (header.toString('ascii', 0, 4) === 'HTTP') {
		return new ConnectionProtocolError(
			'OVERLAY_HTTP_DETECTED',
			'HTTP response detected on the Stellar overlay port'
		);
	}

	const frameLength = header.readUInt32BE(0) & 0x7fffffff;
	if (frameLength === 0 || frameLength > MAX_OVERLAY_FRAME_BYTES) {
		return new ConnectionProtocolError(
			'OVERLAY_INVALID_FRAME',
			'Invalid Stellar overlay record marker'
		);
	}

	return null;
}
