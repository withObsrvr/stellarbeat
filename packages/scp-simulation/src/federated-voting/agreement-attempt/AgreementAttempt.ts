import { Statement } from '../Statement';
import { Node, PublicKey } from '../..';
import { QuorumSet } from '../QuorumSet';
import { EventCollector } from '../../core/EventCollector';
import { AgreementAttemptMovedToAcceptPhase } from './event/AgreementAttemptMovedToAcceptPhase';
import { VoteRatified } from './event/VoteRatified';
import { AcceptVoteRatified } from './event/AcceptVoteRatified';
import { AcceptVoteVBlocked } from './event/AcceptVoteVBlocked';
import { AgreementAttemptMovedToConfirmPhase } from './event/AgreementAttemptMovedToConfirmPhase';

export enum AgreementAttemptPhase {
	unknown = 'unknown',
	accepted = 'accepted',
	confirmed = 'confirmed'
}
/*
 * An attempt on agreement by a specific node on a specific statement.
 */
export class AgreementAttempt extends EventCollector {
	// a node could change its quorumSet, so we need to keep track of the quorumSet of the votes
	private votesForStatement: Map<PublicKey, QuorumSet> = new Map(); //the peers that voted for this statement
	private votesToAcceptStatement: Map<PublicKey, QuorumSet> = new Map(); //the peers that accepted this statement

	public phase = AgreementAttemptPhase.unknown; //where we are in this round of federated voting for this node
	public votedFor = false; //if the node voted for this statement

	private constructor(
		public readonly node: Node,
		public readonly statement: Statement
	) {
		super();
	}

	addVotedForStatement(publicKey: PublicKey, quorumSet: QuorumSet): void {
		this.votesForStatement.set(publicKey, quorumSet);
	}

	addVotedToAcceptStatement(publicKey: PublicKey, quorumSet: QuorumSet): void {
		this.votesToAcceptStatement.set(publicKey, quorumSet);
	}

	//get vote(statement) + vote(accept(statement))
	public getAllVotes(): Map<PublicKey, QuorumSet> {
		return new Map([...this.votesForStatement, ...this.votesToAcceptStatement]);
	}

	public getAcceptVotes(): Map<PublicKey, QuorumSet> {
		return this.votesToAcceptStatement;
	}

	public getAcceptVoters(): PublicKey[] {
		return Array.from(this.votesToAcceptStatement.keys());
	}

	public getVotesForStatement(): Map<PublicKey, QuorumSet> {
		return this.votesForStatement;
	}

	static create(node: Node, statement: Statement): AgreementAttempt {
		return new this(node, statement);
	}

	tryMoveToAcceptPhase(): boolean {
		if (this.phase !== 'unknown') {
			return false;
		}

		if (this.areAcceptingNodesVBlocking()) {
			this.registerEvent(
				new AcceptVoteVBlocked(
					this.node.publicKey,
					this.statement,
					new Set(Array.from(this.getAcceptVotes().keys()))
				)
			);
			this.phase = AgreementAttemptPhase.accepted;
			this.registerEvent(
				new AgreementAttemptMovedToAcceptPhase(
					this.node.publicKey,
					this.phase,
					this.statement
				)
			);
			return true;
		}

		if (this.isVoteRatified()) {
			this.phase = AgreementAttemptPhase.accepted;
			this.registerEvent(
				new AgreementAttemptMovedToAcceptPhase(
					this.node.publicKey,
					this.phase,
					this.statement
				)
			);
			return true;
		}

		return false;
	}

	tryMoveToConfirmPhase(): boolean {
		if (this.phase === 'confirmed') {
			return false;
		}

		if (this.isAcceptVoteRatified()) {
			this.phase = AgreementAttemptPhase.confirmed;
			this.registerEvent(
				new AgreementAttemptMovedToConfirmPhase(
					this.node.publicKey,
					this.phase,
					this.statement
				)
			);
			return true;
		}

		return false;
	}

	private areAcceptingNodesVBlocking(): boolean {
		return this.node.quorumSet.isSetVBlocking(
			Array.from(this.getAcceptVotes().keys())
		);
	}

	private isVoteRatified(): boolean {
		const quorumOrNull = this.node.isQuorum(this.getAllVotes());
		if (quorumOrNull !== null) {
			this.registerEvent(
				new VoteRatified(this.node.publicKey, this.statement, quorumOrNull)
			);
		}
		return quorumOrNull !== null;
	}

	private isAcceptVoteRatified(): boolean {
		const quorumOrNull = this.node.isQuorum(this.getAcceptVotes());
		if (quorumOrNull !== null) {
			this.registerEvent(
				new AcceptVoteRatified(
					this.node.publicKey,
					this.statement,
					quorumOrNull
				)
			);
		}

		return quorumOrNull !== null;
	}

	toString(): string {
		return `Agreement attempt on statement '${this.statement}' in phase '${this.phase}' by node '${this.node.publicKey}'`;
	}
}
