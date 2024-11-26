import { Node, PublicKey, QuorumSet, Statement } from '..';
import { Context } from '../core/Context';
import { Event } from '../core/Event';
import { InMemoryEventCollector } from '../core/EventCollector';
import { Message } from '../simulation/Message';
import { ProtocolAction } from '../core/ProtocolAction';
import { SendMessageProtocolAction } from './action/protocol/SendMessageAction';
import { FederatedVotingState } from './protocol/FederatedVotingState';
import { FederatedVotingProtocol } from './protocol/FederatedVotingProtocol';
import { Vote } from './protocol';
import { MessageSent } from './event/MessageSent';
import { MessageReceived } from './event/MessageReceived';
import { BroadcastVoteRequested } from './protocol/event/BroadcastVoteRequested';

export class FederatedVotingContext
	extends InMemoryEventCollector //todo: composition
	implements Context
{
	private federatedVotingStates: Map<PublicKey, FederatedVotingState> =
		new Map();

	constructor(private federatedVotingProtocol: FederatedVotingProtocol) {
		super();
	}

	reset(): void {
		//todo: could we make this class purer?
		this.federatedVotingStates.clear();
		this.drainEvents(); // Clear the collected events
	}

	//todo: naming of addNode. Should the action create a new State, or should we just pass a Node
	addNode(state: FederatedVotingState): void {
		this.federatedVotingStates.set(state.node.publicKey, state);
	}

	vote(publicKey: PublicKey, statement: Statement): ProtocolAction[] {
		if (!this.canVote(publicKey)) {
			console.log('Node cannot vote');
			return [];
		}

		const nodeFederatedVotingState = this.federatedVotingStates.get(publicKey);
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
		const nodeFederatedVotingState = this.federatedVotingStates.get(publicKey);
		if (!nodeFederatedVotingState) {
			console.log('Node not found');
			return false;
		}

		return nodeFederatedVotingState.voted === null; //todo also check if there is a command!
	}

	sendMessage(message: Message): ProtocolAction[] {
		const messageSent = new MessageSent(message);
		this.registerEvent(messageSent);
		return this.deliverMessage(message); //in the future this will be handled by overlay, and allows for delaying the message etc
	}

	private deliverMessage(message: Message): ProtocolAction[] {
		const nodeFederatedVotingState = this.federatedVotingStates.get(
			message.receiver
		);
		if (!nodeFederatedVotingState) {
			console.log('Node not found'); //todo: throw error?
			return [];
		}

		const messageReceived = new MessageReceived(message);
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
			protocolActions.push(new SendMessageProtocolAction(message));
		});

		return protocolActions;
	}

	private getCompleteConnections(publicKey: PublicKey): PublicKey[] {
		return this.nodes
			.filter((node) => node.publicKey !== publicKey)
			.map((node) => node.publicKey);
	}

	get nodes(): Node[] {
		return Array.from(this.federatedVotingStates.values()).map(
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
