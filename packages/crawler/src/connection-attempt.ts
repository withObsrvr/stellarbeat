import { NodeInfo } from 'node-connector';

export type ConnectionAttemptOutcome =
	| 'authenticated'
	| 'dns_failed'
	| 'tcp_refused'
	| 'tcp_timeout'
	| 'tls_detected'
	| 'http_detected'
	| 'invalid_overlay_frame'
	| 'overlay_auth_failed'
	| 'protocol_incompatible'
	| 'wrong_network'
	| 'unexpected_public_key'
	| 'connection_closed'
	| 'rate_limited'
	| 'probe_budget_exhausted';

export type ConnectionFailureStage =
	| 'dns'
	| 'tcp'
	| 'overlay_hello'
	| 'overlay_auth'
	| 'identity';

export interface ConnectionAttempt {
	address: string;
	ip: string;
	port: number;
	attemptedAt: Date;
	completedAt: Date;
	outcome: ConnectionAttemptOutcome;
	failureStage?: ConnectionFailureStage;
	remotePublicKey?: string;
	nodeInfo?: NodeInfo;
	errorCode?: string;
	sanitizedDetail?: string;
}

interface ErrorWithCode extends Error {
	code?: string;
}

const SAFE_ERROR_DETAIL_MAX_LENGTH = 240;

export function sanitizeConnectionErrorDetail(detail: string): string {
	return detail
		.replace(/[\r\n\t]+/g, ' ')
		.replace(/\s+/g, ' ')
		.slice(0, SAFE_ERROR_DETAIL_MAX_LENGTH);
}

export function classifyConnectionError(
	error: Error,
	socketConnected: boolean,
	receivedHello: boolean
): Pick<
	ConnectionAttempt,
	'outcome' | 'failureStage' | 'errorCode' | 'sanitizedDetail'
> {
	const code = (error as ErrorWithCode).code;
	const message = error.message || error.name;

	switch (code) {
		case 'ENOTFOUND':
		case 'EAI_AGAIN':
			return failure('dns_failed', 'dns', code, message);
		case 'ECONNREFUSED':
			return failure('tcp_refused', 'tcp', code, message);
		case 'ETIMEDOUT':
			return failure(
				socketConnected ? 'overlay_auth_failed' : 'tcp_timeout',
				socketConnected ? 'overlay_hello' : 'tcp',
				code,
				message
			);
		case 'OVERLAY_TLS_DETECTED':
			return failure('tls_detected', 'overlay_hello', code, message);
		case 'OVERLAY_HTTP_DETECTED':
			return failure('http_detected', 'overlay_hello', code, message);
		case 'OVERLAY_INVALID_FRAME':
			return failure('invalid_overlay_frame', 'overlay_hello', code, message);
		case 'OVERLAY_WRONG_NETWORK':
			return failure('wrong_network', 'overlay_hello', code, message);
		case 'OVERLAY_PROTOCOL_INCOMPATIBLE':
			return failure('protocol_incompatible', 'overlay_hello', code, message);
	}

	if (message.toLowerCase().includes('invalid auth cert')) {
		return failure(
			'overlay_auth_failed',
			'overlay_hello',
			'INVALID_AUTH_CERT',
			message
		);
	}

	return failure(
		'overlay_auth_failed',
		receivedHello ? 'overlay_auth' : socketConnected ? 'overlay_hello' : 'tcp',
		code ?? 'CONNECTION_ERROR',
		message
	);
}

function failure(
	outcome: ConnectionAttemptOutcome,
	failureStage: ConnectionFailureStage,
	errorCode: string,
	detail: string
) {
	return {
		outcome,
		failureStage,
		errorCode,
		sanitizedDetail: sanitizeConnectionErrorDetail(detail)
	};
}
