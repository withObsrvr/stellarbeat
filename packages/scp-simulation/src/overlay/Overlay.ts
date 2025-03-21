import { InMemoryEventCollector } from '../core';
import {
	ForgedMessageSent,
	Message,
	MessageReceived,
	MessageSent,
	Vote
} from '../federated-voting';
import { ReceiveMessage } from '../federated-voting/action/protocol/ReceiveMessage';
import { Gossip } from './action/Gossip';
import { BroadcastDisrupted } from './event/BroadcastDisrupted';
import { BroadcastFailed } from './event/BroadcastFailed';
import { ConnectionAdded } from './event/ConnectionAdded';
import { ConnectionRemoved } from './event/ConnectionRemoved';
import { GossipDisrupted } from './event/GossipDisrupted';
import { ReceiveMessageDisrupted } from './event/ReceiveMessageDisrupted';

export type PublicKey = string;
export type OverlayAction = ReceiveMessage | Gossip;
export type Payload = Vote; //todo: generics in Message

export class Overlay extends InMemoryEventCollector {
	public nodes: Set<PublicKey> = new Set();
	public connections: Map<PublicKey, Set<PublicKey>> = new Map();

	private _fullyConnected = false;
	private _gossipEnabled = false;

	constructor(fullyConnected = true, gossipEnabled = false) {
		super();
		this._fullyConnected = fullyConnected;
		this._gossipEnabled = gossipEnabled;
	}

	//Track sent and received payloads(e.g. votes) for every node
	private exchanges = new Set<string>();
	private getExchangeKey(
		sender: PublicKey,
		receiver: PublicKey,
		payload: Payload
	): string {
		const [first, second] = [sender, receiver].sort();
		return `${first}-${payload.hash()}-${second}`;
	}
	private markExchanged(message: Message): void {
		this.exchanges.add(
			this.getExchangeKey(message.sender, message.receiver, message.vote)
		);
	}
	private hasExchangedPayload(
		sender: PublicKey,
		receiver: PublicKey,
		payload: Payload
	): boolean {
		return this.exchanges.has(this.getExchangeKey(sender, receiver, payload));
	}

	private removeExchanges(node: PublicKey) {
		this.exchanges = new Set(
			[...this.exchanges].filter(
				(key) => !key.startsWith(`${node}-`) && !key.endsWith(`-${node}`)
			)
		);
	}

	get fullyConnected(): boolean {
		return this._fullyConnected;
	}

	get gossipEnabled(): boolean {
		return this._gossipEnabled;
	}

	reset(): void {
		this.nodes = new Set();
		this.connections = new Map();
		this.exchanges = new Set();
	}

	addNode(node: PublicKey): void {
		this.nodes.add(node);
		if (!this.connections.has(node)) {
			this.connections.set(node, new Set());
		}
		if (this.fullyConnected) this.makeFullyConnected();
	}

	removeNode(node: PublicKey): void {
		this.nodes.delete(node);
		this.connections.delete(node);
		// Remove connections to this node from all other nodes
		for (const [, neighbors] of this.connections) {
			neighbors.delete(node);
		}
		this.removeExchanges(node);
	}

	addConnection(a: PublicKey, b: PublicKey): void {
		if (!this.nodes.has(a) || !this.nodes.has(b)) {
			console.log('Nodes in connection not found', a, b);
			return;
		}

		// Create node entries in connections map if they don't exist
		if (!this.connections.has(a)) this.connections.set(a, new Set());
		if (!this.connections.has(b)) this.connections.set(b, new Set());

		// Add bidirectional connection
		this.connections.get(a)!.add(b);
		this.connections.get(b)!.add(a);

		if (!this.fullyConnected) this.registerEvent(new ConnectionAdded(a, b));
	}

	removeConnection(a: PublicKey, b: PublicKey): void {
		const aConnectectToB = this.connections.get(a)?.has(b);
		const bConnectectToA = this.connections.get(b)?.has(a);

		if (aConnectectToB || bConnectectToA) {
			this.registerEvent(new ConnectionRemoved(a, b));
			this.connections.get(a)?.delete(b);
			this.connections.get(b)?.delete(a);
		}
	}

	broadcast(
		broadcaster: PublicKey,
		payload: Payload,
		neighborBlackList: PublicKey[] = []
	): OverlayAction[] {
		const actions: OverlayAction[] = [];
		for (const node of this.connections.get(broadcaster) || []) {
			if (node === broadcaster) {
				continue;
			}
			if (neighborBlackList.includes(node)) {
				this.registerEvent(new BroadcastDisrupted(broadcaster, node, payload));
				continue;
			}
			const message = new Message(broadcaster, node, payload);
			actions.push(new ReceiveMessage(message));
			this.markSent(message);
		}
		if (actions.length === 0 && neighborBlackList.length === 0) {
			//indicate that there were no overlay connections
			this.registerEvent(new BroadcastFailed(broadcaster, payload));
		}
		return actions;
	}

	receiveMessage(message: Message, isDisrupted: boolean): OverlayAction[] {
		if (isDisrupted) {
			this.registerEvent(
				new ReceiveMessageDisrupted(
					message.receiver,
					message.sender,
					message.vote
				)
			);
			return [];
		}
		this.markReceived(message);
		const results: OverlayAction[] = [];

		// If gossip is enabled, check if we need to gossip to neighbors
		if (
			this.gossipEnabled &&
			!this.hasSentToAllNeighbors(message.receiver, message.vote)
		) {
			results.push(new Gossip(message.receiver, message.vote));
		}
		return results;
	}

	gossip(
		sender: PublicKey,
		payload: Payload,
		neighborBlackList: PublicKey[]
	): OverlayAction[] {
		const actions: OverlayAction[] = [];
		const neighbors = this.connections.get(sender) || new Set();

		for (const neighbor of neighbors) {
			if (!this.hasExchangedPayload(sender, neighbor, payload)) {
				if (neighborBlackList.includes(neighbor)) {
					this.registerEvent(new GossipDisrupted(sender, neighbor, payload));
					continue;
				}
				const newMessage = new Message(sender, neighbor, payload);
				actions.push(this.sendMessage(newMessage));
			}
		}
		return actions;
	}

	sendMessage(message: Message, isForged = false): OverlayAction {
		this.markSent(message, isForged);
		return new ReceiveMessage(message);
	}

	private makeFullyConnected(): void {
		for (const n1 of this.nodes) {
			for (const n2 of this.nodes) {
				if (n1 !== n2) {
					this.addConnection(n1, n2);
				}
			}
		}
	}

	private markSent(message: Message, isForged = false): void {
		if (!isForged) this.registerEvent(new MessageSent(message));
		else this.registerEvent(new ForgedMessageSent(message));
		this.markExchanged(message);
	}

	private markReceived(message: Message): void {
		this.registerEvent(new MessageReceived(message));
		this.markExchanged(message);
	}

	private hasSentToAllNeighbors(node: PublicKey, payload: Payload): boolean {
		const neighbors = this.connections.get(node) || new Set();

		for (const neighbor of neighbors) {
			if (!this.hasExchangedPayload(node, neighbor, payload)) {
				return false;
			}
		}
		return true;
	}
}
