import { PublicKey, Statement } from '..';
import { EventCollector } from '../core/EventCollector';
import { FederatedVotingProtocol } from '../federated-voting/FederatedVotingProtocol';
import { FederatedVotingState } from '../federated-voting/FederatedVotingState';
import { Vote } from '../federated-voting/Vote';
import { Voted } from '../federated-voting/event/Voted';
import { PhaseTransitioner } from '../federated-voting/phase-transitioner/PhaseTransitioner';
import { QuorumSet } from './QuorumSet';
import { Message } from './Message';
import { MessageSent } from './event/MessageSent';

export class NodeOrchestrator extends EventCollector {
	private connections: Set<PublicKey> = new Set();
	private federatedVotingProtocol = new FederatedVotingProtocol(
		new PhaseTransitioner()
	);
	private federatedVotingState: FederatedVotingState;
	private processedVotes: Set<Vote> = new Set();
	private quorumSet: QuorumSet;

	constructor(
		public readonly publicKey: PublicKey,
		quorumSet: QuorumSet,
		connections: PublicKey[] = []
	) {
		super();
		this.quorumSet = quorumSet;
		this.federatedVotingState = new FederatedVotingState(publicKey, quorumSet);
		connections.forEach((connection) => this.addConnection(connection));
	}

	updateQuorumSet(quorumSet: QuorumSet): void {
		this.quorumSet = quorumSet;
	}

	getQuorumSet(): QuorumSet {
		return this.quorumSet;
	}

	//todo: move to overlay class?
	addConnection(connection: PublicKey): void {
		this.connections.add(connection);
	}

	removeConnection(connection: PublicKey): void {
		this.connections.delete(connection);
	}

	getConnections(): PublicKey[] {
		return Array.from(this.connections);
	}

	receiveMessage(message: Message): void {
		this.federatedVotingProtocol.processVote(
			message.vote,
			this.federatedVotingState
		);
		const federatedVoteEvents = this.federatedVotingProtocol.drainEvents();
		this.registerEvents(federatedVoteEvents);

		federatedVoteEvents
			.filter((event) => event instanceof Voted)
			.forEach((event) => {
				this.broadcast((event as Voted).vote);
			});

		this.broadcast(message.vote); //pass on the message
	}

	vote(statement: Statement): void {
		this.federatedVotingProtocol.vote(statement, this.federatedVotingState);
		const federatedVoteEvents = this.federatedVotingProtocol.drainEvents();
		this.registerEvents(federatedVoteEvents);

		federatedVoteEvents
			.filter((event) => event instanceof Voted)
			.forEach((event) => {
				this.broadcast((event as Voted).vote);
			});
	}

	private broadcast(vote: Vote): void {
		if (this.processedVotes.has(vote)) return;
		this.connections.forEach((connection) => {
			this.registerEvent(
				new MessageSent(new Message(this.publicKey, connection, vote))
			);
		});
		this.processedVotes.add(vote);
	}

	getFederatedVotingState(): FederatedVotingState {
		return this.federatedVotingState;
	}
}
