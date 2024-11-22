import { Node, PublicKey, QuorumSet, Statement } from '..';
import { Context } from '../core/Context';
import { InMemoryEventCollector } from '../core/EventCollector';
import { Voted } from '../federated-voting-protocol';
import { FederatedVotingProtocol } from '../federated-voting-protocol/FederatedVotingProtocol';
import { FederatedVotingState } from '../federated-voting-protocol/FederatedVotingState';
import { Message } from '../simulation/Message';
import { ProtocolAction } from '../core/ProtocolAction';
import { UserAction } from '../core/UserAction';

export class FederatedVotingContext
	extends InMemoryEventCollector
	implements Context
{
	private federatedVotingStates: Map<PublicKey, FederatedVotingState> =
		new Map();

	constructor(private federatedVotingProtocol: FederatedVotingProtocol) {
		super();
	}

	executeUserAction(action: UserAction): ProtocolAction[] {
		//use instanceof to execute the right method
		return [];
	}

	executeProtocolAction(action: ProtocolAction): ProtocolAction[] {
		//use instanceof to execute the right method
		return [];
	}

	addNode(state: FederatedVotingState): void {
		this.federatedVotingStates.set(state.node.publicKey, state);
	}

	vote(publicKey: PublicKey, statement: Statement): void {
		const nodeFederatedVotingState = this.federatedVotingStates.get(publicKey);
		if (!nodeFederatedVotingState) {
			console.log('Node not found');
			return;
		}

		this.federatedVotingProtocol.vote(statement, nodeFederatedVotingState);
		const events = this.federatedVotingProtocol.drainEvents();

		this.registerEvents(events);

		events
			.filter((event) => event instanceof Voted)
			.forEach((event) => {
				this.broadcast((event as Voted).vote);
			});
	}

	canVote(publicKey: PublicKey): boolean {
		const nodeFederatedVotingState = this.federatedVotingStates.get(publicKey);
		if (!nodeFederatedVotingState) {
			console.log('Node not found');
			return false;
		}

		return nodeFederatedVotingState.voted === null; //todo also check if there is a command!
	}

	//in the future we handle this with an overlay class. For now we assume all nodes are connected.
	//As in the scp whitepaper we assume an asynchronous network that eventually delivers all messages.
	//For every message, a send action is queued. This allows the user to 'tamper' with these actions before
	//they are actually executed
	private broadcast(vote: Vote): void {
		this.nodes.forEach((node) => {
			if (node.publicKey === vote.publicKey) return;
			const message = new Message(vote.publicKey, node.publicKey, vote);
			const event = new QueuedMessage(message); //for the log
			this.registerEvent(event);
			const action = new SendMessageProtocolAction(message);
			this.protocolActionQueue.add(action);
		});
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
