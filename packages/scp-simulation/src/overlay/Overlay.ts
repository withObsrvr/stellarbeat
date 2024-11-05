import { PublicKey } from '..';
import { EventCollector } from '../core/EventCollector';
import { BaseQuorumSet } from '../node/BaseQuorumSet';

import { NodeOrchestrator } from '../node/NodeOrchestrator';
import { ConnectionAdded } from './event/ConnectionAdded';
import { NodeAdded } from './event/NodeAdded';

/**
 * Manages the nodes and their connections
 */
export class Overlay extends EventCollector {
	private nodeMap: Map<PublicKey, NodeOrchestrator> = new Map();

	addNode(publicKey: PublicKey, quorumSet: BaseQuorumSet): void {
		if (this.nodeMap.has(publicKey)) {
			console.log('Node already exists');
			return;
		}
		const node = new NodeOrchestrator(publicKey, quorumSet);
		this.nodeMap.set(publicKey, node);

		this.registerEvent(new NodeAdded(publicKey));
	}

	addConnection(nodeA: PublicKey, nodeB: PublicKey): void {
		const nodeAInstance = this.nodeMap.get(nodeA);
		const nodeBInstance = this.nodeMap.get(nodeB);
		if (!nodeAInstance || !nodeBInstance) {
			console.log('Node not found');
			return;
		}
		nodeAInstance.addConnection(nodeB);
		nodeBInstance.addConnection(nodeA);

		this.registerEvent(new ConnectionAdded(nodeA, nodeB));
	}

	getNode(publicKey: PublicKey): NodeOrchestrator | undefined {
		return this.nodeMap.get(publicKey);
	}

	getNodes(): NodeOrchestrator[] {
		return Array.from(this.nodeMap.values());
	}
}
