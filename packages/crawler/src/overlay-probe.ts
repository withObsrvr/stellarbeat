import { createNode, NodeConfig } from 'node-connector';
import { pino } from 'pino';
import { ConnectionAttempt } from './connection-attempt';
import { ConnectionManager } from './network-observer/connection-manager';

export interface OverlayProbeOptions {
	timeoutMs?: number;
	vantagePoint?: string;
}

export async function probeOverlayEndpoint(
	nodeConfig: NodeConfig,
	ip: string,
	port: number,
	logger = pino({ level: 'silent', base: undefined }),
	options: OverlayProbeOptions = {}
): Promise<ConnectionAttempt> {
	const node = createNode(nodeConfig, logger);
	const connectionManager = new ConnectionManager(node, new Set(), logger);
	const timeoutMs = options.timeoutMs ?? 5000;

	return await new Promise<ConnectionAttempt>((resolve) => {
		let settled = false;
		const complete = (attempt: ConnectionAttempt) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			connectionManager.shutdown();
			resolve(attempt);
		};

		connectionManager.once('connectionAttempt', complete);
		const attemptedAt = new Date();
		const timer = setTimeout(() => {
			complete({
				address: `${ip}:${port}`,
				ip,
				port,
				attemptedAt,
				completedAt: new Date(),
				outcome: 'overlay_auth_failed',
				failureStage: 'overlay_hello',
				errorCode: 'PROBE_TIMEOUT',
				sanitizedDetail:
					'Probe timed out before Stellar overlay authentication completed'
			});
		}, timeoutMs);

		connectionManager.connectToNode(ip, port);
	});
}
