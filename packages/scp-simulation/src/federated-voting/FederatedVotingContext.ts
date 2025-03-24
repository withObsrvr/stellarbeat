import {
	Event,
	Context,
	InMemoryEventCollector,
	Node,
	PublicKey,
	QuorumSet,
	UserAction
} from '../core';

import { Message } from './Message';
import { ProtocolAction } from '../core/ProtocolAction';
import { FederatedVotingProtocolState } from './protocol/FederatedVotingProtocolState';
import { FederatedVotingProtocol } from './protocol/FederatedVotingProtocol';
import { Statement } from './protocol';
import { BroadcastVoteRequested } from './protocol/event/BroadcastVoteRequested';
import { NodeUpdatedQuorumSet } from './protocol/event/NodeUpdatedQuorumSet';
import { Overlay, Payload } from '../overlay/Overlay';
import { Broadcast } from './action/protocol/Broadcast';

export interface FederatedVotingContextState {
	protocolStates: FederatedVotingProtocolState[];
	safetyDisruptingNodes: Set<string>;
	livenessDisruptingNodes: Set<string>;
}

export class FederatedVotingContext
	extends InMemoryEventCollector //todo: composition
	implements Context
{
	private state: FederatedVotingContextState = {
		protocolStates: [],
		safetyDisruptingNodes: new Set<string>(),
		livenessDisruptingNodes: new Set<string>()
	};

	constructor(
		private federatedVotingProtocol: FederatedVotingProtocol,
		private overlay: Overlay
	) {
		super();
	}

	reset(): void {
		this.state.protocolStates = [];
		this.state.livenessDisruptingNodes.clear();
		this.state.safetyDisruptingNodes.clear();
		this.overlay.reset();
		this.drainEvents(); // Clear the collected events
	}

	//for exposing the state in GUI. Should not be altered directly
	getState(): FederatedVotingContextState {
		return this.state;
	}

	//userActions are always executed first
	executeActions(
		protocolActions: ProtocolAction[],
		userActions: UserAction[]
	): ProtocolAction[] {
		const newProtocolActions: ProtocolAction[] = [];

		//sort userActions such that userActions with boolean immediateExecution set to true runs first
		//order of immediateExecution should be preserved
		userActions.sort((a, b) => {
			if (a.immediateExecution && !b.immediateExecution) {
				return -1;
			}
			if (!a.immediateExecution && b.immediateExecution) {
				return 1;
			}
			return 0;
		});

		userActions.forEach((action) => {
			newProtocolActions.push(...action.execute(this));
		});

		protocolActions.forEach((action) => {
			newProtocolActions.push(...action.execute(this));
		});

		return newProtocolActions;
	}

	addNode(node: Node): ProtocolAction[] {
		if (this.getProtocolState(node.publicKey)) {
			return [];
		}
		this.state.protocolStates.push(new FederatedVotingProtocolState(node));

		this.overlay.addNode(node.publicKey);
		//todo: Events?

		return [];
	}

	addConnection(a: PublicKey, b: PublicKey): ProtocolAction[] {
		this.overlay.addConnection(a, b);
		this.registerEvents(this.overlay.drainEvents());

		return [];
	}

	removeConnection(a: PublicKey, b: PublicKey): ProtocolAction[] {
		this.overlay.removeConnection(a, b);
		this.registerEvents(this.overlay.drainEvents());

		return [];
	}

	removeNode(publicKey: string): ProtocolAction[] {
		const index = this.state.protocolStates.findIndex(
			(state) => state.node.publicKey === publicKey
		);
		if (index === -1) {
			console.log('Node not found');
			return [];
		}

		this.state.protocolStates.splice(index, 1);

		this.overlay.removeNode(publicKey);
		//todo: Events?

		return [];
	}

	updateQuorumSet(
		publicKey: PublicKey,
		quorumSet: QuorumSet
	): ProtocolAction[] {
		const node = this.state.protocolStates
			.map((state) => state.node)
			.find((node) => node.publicKey === publicKey);
		if (!node) {
			console.log('Node not found', publicKey);
			return [];
		}

		node.updateQuorumSet(quorumSet);
		this.registerEvent(new NodeUpdatedQuorumSet(publicKey, quorumSet));

		return [];
	}

	getProtocolState(publicKey: PublicKey): FederatedVotingProtocolState | null {
		const state = this.state.protocolStates.find(
			(state) => state.node.publicKey === publicKey
		);

		return state ? state : null;
	}

	vote(publicKey: PublicKey, statement: Statement): ProtocolAction[] {
		if (!this.canVote(publicKey)) {
			console.log('Node cannot vote');
			return [];
		}

		const nodeFederatedVotingState = this.state.protocolStates.find(
			(state) => state.node.publicKey === publicKey
		);
		if (!nodeFederatedVotingState) {
			console.log('Node not found');
			return [];
		}

		this.federatedVotingProtocol.vote(statement, nodeFederatedVotingState);
		const events = this.federatedVotingProtocol.drainEvents();

		this.registerEvents(events);

		return this.processVoteBroadcastRequests(events);
	}

	private processVoteBroadcastRequests(events: Event[]): ProtocolAction[] {
		const protocolActions: ProtocolAction[] = [];
		events
			.filter((event) => event instanceof BroadcastVoteRequested)
			.forEach((event) => {
				const broadcastVoteRequested = event as BroadcastVoteRequested;
				protocolActions.push(
					new Broadcast(
						broadcastVoteRequested.publicKey,
						broadcastVoteRequested.vote
					)
				);
			});

		return protocolActions;
	}

	canVote(publicKey: PublicKey): boolean {
		const nodeFederatedVotingState = this.state.protocolStates.find(
			(state) => state.node.publicKey === publicKey
		);
		if (!nodeFederatedVotingState) {
			console.log('Node not found');
			return false;
		}

		return nodeFederatedVotingState.voted === null; //todo also check if there is a command!
	}

	forgeMessage(message: Message): ProtocolAction[] {
		this.state.safetyDisruptingNodes.add(message.sender);
		this.state.livenessDisruptingNodes.add(message.sender);
		const action = this.overlay.sendMessage(message, true);
		this.registerEvents(this.overlay.drainEvents());

		return [action];
	}

	broadcast(
		broadcaster: PublicKey,
		payload: Payload,
		neighborBlackList: PublicKey[]
	): ProtocolAction[] {
		if (neighborBlackList.length > 0) {
			this.state.livenessDisruptingNodes.add(broadcaster);
		}

		const actions = this.overlay.broadcast(
			broadcaster,
			payload,
			neighborBlackList
		);
		this.registerEvents(this.overlay.drainEvents());

		return actions;
	}

	gossip(
		gossiper: PublicKey,
		payload: Payload,
		neighborBlackList: PublicKey[]
	): ProtocolAction[] {
		if (neighborBlackList.length > 0) {
			this.state.livenessDisruptingNodes.add(gossiper);
		}
		const actions = this.overlay.gossip(gossiper, payload, neighborBlackList);
		this.registerEvents(this.overlay.drainEvents());

		return actions;
	}

	receiveMessage(message: Message, isDisrupted: boolean): ProtocolAction[] {
		if (isDisrupted) {
			this.state.livenessDisruptingNodes.add(message.receiver);
		}

		const nodeFederatedVotingState = this.getProtocolState(message.receiver);
		if (!nodeFederatedVotingState) {
			console.log('Node not found'); //todo: throw error?
			return [];
		}

		const gossipActions = this.overlay.receiveMessage(message, isDisrupted);
		this.registerEvents(this.overlay.drainEvents());

		if (isDisrupted) {
			return gossipActions;
		}

		this.federatedVotingProtocol.processVote(
			message.vote,
			nodeFederatedVotingState
		);
		const events = this.federatedVotingProtocol.drainEvents();

		this.registerEvents(events);

		return this.processVoteBroadcastRequests(events).concat(gossipActions);
	}

	get nodes(): Node[] {
		return Array.from(this.state.protocolStates.values()).map(
			(state) => state.node
		);
	}

	get publicKeysWithQuorumSets(): {
		publicKey: PublicKey;
		quorumSet: QuorumSet;
	}[] {
		return this.nodes.map((node) => ({
			publicKey: node.publicKey,
			quorumSet: node.quorumSet
		}));
	}

	get overlayConnections(): {
		publicKey: PublicKey;
		connections: PublicKey[];
	}[] {
		const result: { publicKey: PublicKey; connections: PublicKey[] }[] = [];
		this.overlay.connections.forEach((connections, publicKey) => {
			result.push({ publicKey, connections: Array.from(connections) });
		});

		return result;
	}

	get overlayIsGossipEnabled(): boolean {
		return this.overlay.gossipEnabled;
	}

	get overlayIsFullyConnected(): boolean {
		return this.overlay.fullyConnected;
	}

	getOverlaySettings(): {
		gossipEnabled: boolean;
		fullyConnected: boolean;
	} {
		return {
			gossipEnabled: this.overlayIsGossipEnabled,
			fullyConnected: this.overlayIsFullyConnected
		};
	}
}
