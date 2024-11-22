import { Node, PublicKey, QuorumSet, Statement } from '..';
import { Context } from '../core/Context';
import { InMemoryEventCollector } from '../core/EventCollector';
import { Voted } from '../federated-voting-protocol';
import { FederatedVotingProtocol } from '../federated-voting-protocol/FederatedVotingProtocol';
import { FederatedVotingState } from '../federated-voting-protocol/FederatedVotingState';
import { Message } from '../simulation/Message';
import { ProtocolAction } from '../core/ProtocolAction';
import { UserAction } from '../core/UserAction';
import { VoteOnStatement } from './action/user/VoteOnStatement';
import { AddNode } from './action/user/AddNode';
import { SendMessageProtocolAction } from './action/protocol/SendMessageAction';

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
		this.federatedVotingStates.clear();
	}

	executeUserAction(action: UserAction): ProtocolAction[] {
		//use instanceof to execute the right method
		if (action instanceof VoteOnStatement) {
			return this.vote(action.publicKey, action.statement);
		}

		if (action instanceof AddNode) {
			this.addNode(
				new FederatedVotingState(new Node(action.publicKey, action.quorumSet))
			);
			return [];
		}

		return [];
	}

	addNode(state: FederatedVotingState): void {
		this.federatedVotingStates.set(state.node.publicKey, state);
	}

	vote(publicKey: PublicKey, statement: Statement): ProtocolAction[] {
		const nodeFederatedVotingState = this.federatedVotingStates.get(publicKey);
		if (!nodeFederatedVotingState) {
			console.log('Node not found');
			return [];
		}

		this.federatedVotingProtocol.vote(statement, nodeFederatedVotingState);
		const events = this.federatedVotingProtocol.drainEvents();

		this.registerEvents(events);

		const protocolActions: ProtocolAction[] = [];
		events
			.filter((event) => event instanceof Voted)
			.forEach((event) => {
				protocolActions.push(...this.broadcast(event as Voted));
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
		//todo: implement
		//register event that message is sent
		//register event that message is received
		//process message, register events and determine new ProtocolActions

		return [];
	}

	//in the future we handle this with an overlay class. For now we assume all nodes are connected.
	//As in the scp whitepaper we assume an asynchronous network that eventually delivers all messages.
	//For every message, a send action is queued. This allows the user to 'tamper' with these actions before
	//they are actually executed
	private broadcast(voted: Voted): ProtocolAction[] {
		const protocolActions: ProtocolAction[] = [];
		this.nodes.forEach((node) => {
			if (node.publicKey === voted.vote.publicKey) return;
			const message = new Message(
				voted.vote.publicKey,
				node.publicKey,
				voted.vote
			);
			//const event = new QueuedMessage(message); //for the log
			//this.registerEvent(event); //todo: maybe register 'BroadcastRequested' event in Protocol instead
			protocolActions.push(new SendMessageProtocolAction(message));
		});

		return protocolActions;
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
}
