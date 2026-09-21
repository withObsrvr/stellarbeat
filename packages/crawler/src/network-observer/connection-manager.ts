import { EventEmitter } from 'events';
import { Connection, Node as NetworkNode } from 'node-connector';
import { P } from 'pino';
import { truncate } from '../utilities/truncate';
import { StellarMessageWork } from 'node-connector';
import { NodeInfo } from 'node-connector';
import {
	classifyConnectionError,
	ConnectionAttempt
} from '../connection-attempt';

type PublicKey = string;
type Address = string;

export interface ConnectedPayload {
	publicKey: PublicKey;
	ip: string;
	port: number;
	nodeInfo: NodeInfo;
}

export interface DataPayload {
	address: Address;
	stellarMessageWork: StellarMessageWork;
	publicKey: PublicKey;
}

export interface ClosePayload {
	address: string;
	publicKey?: PublicKey;
}

export class ConnectionManager extends EventEmitter {
	private activeConnections: Map<string, Connection>;
	private pendingConnections: Map<string, Connection> = new Map();
	private attemptStartedAt: Map<string, Date> = new Map();
	private socketConnected: Set<string> = new Set();
	private attemptCompleted: Set<string> = new Set();

	constructor(
		private node: NetworkNode,
		private blackList: Set<PublicKey>,
		private logger: P.Logger
	) {
		super();
		this.activeConnections = new Map(); // Active connections keyed by node public key or address
	}

	/**
	 * Connects to a node at the specified IP and port.
	 * @param {string} ip The IP address of the node.
	 * @param {number} port The port number of the node.
	 */
	connectToNode(ip: string, port: number) {
		const address = `${ip}:${port}`;
		this.attemptCompleted.delete(address);
		this.socketConnected.delete(address);
		this.attemptStartedAt.set(address, new Date());
		const connection = this.node.connectTo(ip, port);
		this.pendingConnections.set(address, connection);
		this.logger.debug({ peer: connection.remoteAddress }, 'Connecting');

		// Setup event listeners for the connection
		connection.on('socketConnected', () => {
			this.socketConnected.add(address);
		});

		connection.on('connect', (publicKey, nodeInfo) => {
			this.logger.trace('Connect event received');
			if (this.blackList.has(publicKey)) {
				this.logger.debug({ peer: connection.remoteAddress }, 'Blacklisted');
				this.disconnect(connection);
				return;
			}
			this.logger.debug(
				{
					pk: truncate(publicKey),
					peer: connection.remoteAddress,
					local: connection.localAddress
				},
				'Connected'
			);
			this.activeConnections.set(address, connection);
			this.pendingConnections.delete(address);
			connection.remotePublicKey = publicKey;
			this.completeAttempt({
				address,
				ip,
				port,
				attemptedAt: this.attemptStartedAt.get(address) ?? new Date(),
				completedAt: new Date(),
				outcome: 'authenticated',
				remotePublicKey: publicKey,
				nodeInfo
			});
			this.emit('connected', { publicKey, ip, port, nodeInfo });
		});

		connection.on('error', (error) => {
			this.logger.debug(`Connection error with ${address}: ${error.message}`);
			this.completeFailedAttempt(address, ip, port, error, connection);
			this.disconnect(connection, error);
		});

		connection.on('timeout', () => {
			this.logger.debug(`Connection timeout for ${address}`);
			const timeout = new Error('Connection timed out');
			(timeout as Error & { code?: string }).code = 'ETIMEDOUT';
			this.completeFailedAttempt(address, ip, port, timeout, connection);
			this.disconnect(connection);
		});

		connection.on('close', (hadError: boolean) => {
			this.logger.debug(
				{
					pk: truncate(connection.remotePublicKey),
					peer: connection.remoteAddress,
					hadError: hadError,
					local: connection.localAddress
				},
				'Node connection closed'
			);
			this.activeConnections.delete(address);
			this.pendingConnections.delete(address);
			if (!this.attemptCompleted.has(address)) {
				this.completeAttempt({
					address,
					ip,
					port,
					attemptedAt: this.attemptStartedAt.get(address) ?? new Date(),
					completedAt: new Date(),
					outcome: 'connection_closed',
					failureStage: this.socketConnected.has(address)
						? 'overlay_hello'
						: 'tcp',
					remotePublicKey: connection.remotePublicKey,
					errorCode: 'CONNECTION_CLOSED',
					sanitizedDetail: 'Connection closed before overlay authentication'
				});
			}
			const closePayload: ClosePayload = {
				address,
				publicKey: connection.remotePublicKey
			};
			this.emit('close', closePayload);
		});

		connection.on('data', (stellarMessageWork: StellarMessageWork) => {
			if (!connection.remotePublicKey) {
				this.logger.error(`Received data from unknown peer ${address}`);
				return;
			}
			this.emit('data', {
				address,
				publicKey: connection.remotePublicKey,
				stellarMessageWork
			});
		});
	}

	private completeFailedAttempt(
		address: string,
		ip: string,
		port: number,
		error: Error,
		connection: Connection
	): void {
		const classification = classifyConnectionError(
			error,
			this.socketConnected.has(address),
			connection.remotePublicKey !== undefined
		);
		this.completeAttempt({
			address,
			ip,
			port,
			attemptedAt: this.attemptStartedAt.get(address) ?? new Date(),
			completedAt: new Date(),
			remotePublicKey: connection.remotePublicKey,
			...classification
		});
	}

	private completeAttempt(attempt: ConnectionAttempt): void {
		if (this.attemptCompleted.has(attempt.address)) return;
		this.attemptCompleted.add(attempt.address);
		this.emit('connectionAttempt', attempt);
	}

	private disconnect(connection: Connection, error?: Error): void {
		if (error) {
			this.logger.debug(
				{
					peer: connection.remoteAddress,
					pk: truncate(connection.remotePublicKey),
					error: error.message
				},
				'Disconnecting'
			);
		} else {
			this.logger.trace(
				{
					peer: connection.remoteAddress,
					pk: truncate(connection.remotePublicKey)
				},
				'Disconnecting'
			);
		}

		connection.destroy();
	}

	/*public broadcast(stellarMessage: xdr.StellarMessage, doNotSendTo: Set<Address>) {

	}*/

	public disconnectByAddress(address: Address, error?: Error): void {
		const connection = this.activeConnections.get(address);
		if (!connection) {
			return;
		}
		this.disconnect(connection, error);
	}

	getActiveConnection(address: Address) {
		return this.activeConnections.get(address);
	}

	getActiveConnectionAddresses(): string[] {
		return Array.from(this.activeConnections.keys());
	}

	hasActiveConnectionTo(address: Address) {
		return this.activeConnections.has(address);
	}

	getNumberOfActiveConnections() {
		return this.activeConnections.size;
	}

	/**
	 * Shuts down the connection manager, closing all active connections.
	 */
	shutdown() {
		this.activeConnections.forEach((connection) => {
			this.disconnect(connection);
		}); //what about the in progress connections
		this.pendingConnections.forEach((connection) => {
			this.disconnect(connection);
		});
		this.logger.info('ConnectionManager shutdown: All connections closed.', {
			activeConnections: this.activeConnections.size
		});
	}
}
