import { PublicKey, Statement } from '..';
import { EventCollector } from '../core/EventCollector';
import { FederatedVote } from '../federated-voting/FederatedVote';
import { Vote } from '../federated-voting/Vote';
import { Voted } from '../federated-voting/event/Voted';
import { BaseQuorumSet } from './BaseQuorumSet';
import { Message } from './Message';
import { MessageSent } from './event/MessageSent';

export class NodeOrchestrator extends EventCollector {
	private connections: Set<PublicKey> = new Set();
	private federatedVote: FederatedVote;
	private processedVotes: Set<Vote> = new Set();
	private quorumSet: BaseQuorumSet;

	constructor(
		public readonly publicKey: PublicKey,
		quorumSet: BaseQuorumSet,
		connections: PublicKey[] = []
	) {
		super();
		this.quorumSet = quorumSet;
		this.federatedVote = new FederatedVote(publicKey, quorumSet); //todo: inject?
		connections.forEach((connection) => this.addConnection(connection));
	}

	updateQuorumSet(quorumSet: BaseQuorumSet): void {
		this.quorumSet = quorumSet;
		this.federatedVote.updateQuorumSet(this.quorumSet);
	}

	getQuorumSet(): BaseQuorumSet {
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
		this.federatedVote.processVote(message.vote);
		const federatedVoteEvents = this.federatedVote.drainEvents();
		this.registerEvents(federatedVoteEvents);

		federatedVoteEvents
			.filter((event) => event instanceof Voted)
			.forEach((event) => {
				this.broadcast((event as Voted).vote);
			});

		this.broadcast(message.vote); //pass on the message
	}

	vote(statement: Statement): void {
		this.federatedVote.voteForStatement(statement);
		const federatedVoteEvents = this.federatedVote.drainEvents();
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

	getFederatedVote(): FederatedVote {
		return this.federatedVote;
	}
}
