import assert from 'assert';
import { PublicKey, Statement } from '..';
import { NodeDTO } from '../api/NodeDTO';
import { NodeDTOMapper } from '../api/NodeDTOMapper';
import { QuorumSet } from '../node/QuorumSet';
import { NodeOrchestrator } from '../node/NodeOrchestrator';
import { MessageSent } from '../node/event/MessageSent';
import { Message } from '../node/Message';
import { Overlay } from '../overlay/Overlay';
import { EventCollector } from '../core/EventCollector';

export class Simulation extends EventCollector {
	private overlay: Overlay = new Overlay();
	private messageQueue: Set<Message> = new Set();
	private outbox: Set<Message> = new Set();

	addNode(publicKey: PublicKey, quorumSet: QuorumSet): void {
		this.overlay.addNode(publicKey, quorumSet);
		this.registerEvents(this.overlay.drainEvents());
	}

	addConnection(nodeA: PublicKey, nodeB: PublicKey): void {
		this.overlay.addConnection(nodeA, nodeB);
		this.registerEvents(this.overlay.drainEvents());
	}

	vote(publicKey: PublicKey, statement: Statement): void {
		const node = this.overlay.getNode(publicKey);
		if (!node) {
			console.log('Node not found');
			return;
		}
		node.vote(statement);
		const events = node.drainEvents();
		this.registerEvents(events);
		events.forEach((event) => {
			if (event instanceof MessageSent) {
				this.messageQueue.add(event.message);
			}
		});
	}

	hasMessages(): boolean {
		return this.messageQueue.size > 0;
	}

	moveMessagesToOutbox(): void {
		this.outbox = new Set(this.messageQueue);
		this.messageQueue.clear();
	}

	deliverMessagesInOutbox(): void {
		const messages = Array.from(this.outbox);
		this.outbox.clear();
		messages.forEach((message) => {
			const node = this.overlay.getNode(message.receiver);
			assert(node instanceof NodeOrchestrator);

			console.log(`[overlay] Delivering message: ${message.toString()}`);
			node.receiveMessage(message);
			const events = node.drainEvents();
			this.registerEvents(events);
			events.forEach((event) => {
				if (event instanceof MessageSent) {
					this.messageQueue.add(event.message);
				}
			});
		});
	}

	get nodes(): PublicKey[] {
		return Array.from(this.overlay.getNodes().map((node) => node.publicKey));
	}

	getNodeInfo(publicKey: PublicKey, includeQSet = false): NodeDTO | null {
		const node = this.overlay.getNode(publicKey);
		if (!node) {
			return null;
		}
		return NodeDTOMapper.toDTO(node, includeQSet);
	}

	get publicKeysWithQuorumSets(): {
		publicKey: PublicKey;
		quorumSet: QuorumSet;
	}[] {
		return this.overlay.getNodes().map((node) => ({
			publicKey: node.publicKey,
			quorumSet: node.getQuorumSet()
		}));
	}

	get nodesWithConnections(): {
		publicKey: PublicKey;
		connections: PublicKey[];
	}[] {
		return this.overlay.getNodes().map((node) => ({
			publicKey: node.publicKey,
			connections: node.getConnections()
		}));
	}
}
