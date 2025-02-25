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
import { SendMessage } from './action/protocol/SendMessage';
import { FederatedVotingProtocolState } from './protocol/FederatedVotingProtocolState';
import { FederatedVotingProtocol } from './protocol/FederatedVotingProtocol';
import { Statement, Vote } from './protocol';
import { MessageSent } from './event/MessageSent';
import { MessageReceived } from './event/MessageReceived';
import { BroadcastVoteRequested } from './protocol/event/BroadcastVoteRequested';
import { ReceiveMessage } from './action/protocol/ReceiveMessage';
import { NodeUpdatedQuorumSet } from './protocol/event/NodeUpdatedQuorumSet';

export interface FederatedVotingContextState {
	initialNodes: Node[];
	protocolStates: FederatedVotingProtocolState[];
}

export class FederatedVotingContext
	extends InMemoryEventCollector //todo: composition
	implements Context
{
	private state: FederatedVotingContextState = {
		initialNodes: [],
		protocolStates: []
	};

	constructor(private federatedVotingProtocol: FederatedVotingProtocol) {
		super();
	}

	loadInitialNodes(nodes: Node[]): void {
		this.state.initialNodes = nodes;
		nodes.forEach((node) => this.addNode(node));
	}

	reset(): void {
		//todo: could we make this class purer?
		this.state.protocolStates = [];
		this.drainEvents(); // Clear the collected events
		this.state.initialNodes.forEach((node) => this.addNode(node));
	}

	//for exposing the state in GUI. Should not be altered directly
	getState(): FederatedVotingContextState {
		return this.state;
	}

	executeActions(
		protocolActions: ProtocolAction[],
		userActions: UserAction[]
	): ProtocolAction[] {
		const newProtocolActions: ProtocolAction[] = [];
		protocolActions.forEach((action) => {
			newProtocolActions.push(...action.execute(this));
		});

		userActions.forEach((action) => {
			newProtocolActions.push(...action.execute(this));
		});

		return newProtocolActions;
	}

	addNode(node: Node): void {
		if (this.getProtocolState(node.publicKey)) {
			return;
		}
		this.state.protocolStates.push(new FederatedVotingProtocolState(node));
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

		//todo: should be handled in the protocol and event should be created there
		//but has no sideeffects at the moment so we can do it here for now
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

		return this.processBroadcastRequests(events);
	}

	private processBroadcastRequests(events: Event[]): ProtocolAction[] {
		const protocolActions: ProtocolAction[] = [];
		events
			.filter((event) => event instanceof BroadcastVoteRequested)
			.forEach((event) => {
				const broadcastVoteRequested = event as BroadcastVoteRequested;
				protocolActions.push(...this.broadcast(broadcastVoteRequested.vote));
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

	sendMessage(message: Message): ProtocolAction[] {
		const messageSent = new MessageSent(message.sender, message);
		this.registerEvent(messageSent);

		return [new ReceiveMessage(message)];
	}

	receiveMessage(message: Message): ProtocolAction[] {
		const nodeFederatedVotingState = this.getProtocolState(message.receiver);
		if (!nodeFederatedVotingState) {
			console.log('Node not found'); //todo: throw error?
			return [];
		}

		const messageReceived = new MessageReceived(message.receiver, message);
		this.registerEvent(messageReceived);

		this.federatedVotingProtocol.processVote(
			message.vote,
			nodeFederatedVotingState
		);
		const events = this.federatedVotingProtocol.drainEvents();

		this.registerEvents(events);

		return this.processBroadcastRequests(events);
	}

	//in the future we handle this with an overlay class. For now we assume all nodes are connected.
	//As in the scp whitepaper we assume an asynchronous network that eventually delivers all messages.
	//For every message, a send action is queued. This allows the user to 'tamper' with these actions before
	//they are actually executed
	private broadcast(vote: Vote): ProtocolAction[] {
		const protocolActions: ProtocolAction[] = [];
		this.getCompleteConnections(vote.publicKey).forEach((connection) => {
			const message = new Message(vote.publicKey, connection, vote);
			protocolActions.push(new SendMessage(message));
		});

		return protocolActions;
	}

	private getCompleteConnections(publicKey: PublicKey): PublicKey[] {
		return this.nodes
			.filter((node) => node.publicKey !== publicKey)
			.map((node) => node.publicKey);
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

	get connections(): { publicKey: PublicKey; connections: PublicKey[] }[] {
		return this.nodes.map((node) => ({
			publicKey: node.publicKey,
			connections: this.getCompleteConnections(node.publicKey)
		}));
	}
}
