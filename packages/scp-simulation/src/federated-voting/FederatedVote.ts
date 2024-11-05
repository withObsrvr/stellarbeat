import { Statement } from './Statement';
import { Vote } from './Vote';
import { Node } from './Node';
import { AgreementAttempt } from './agreement-attempt/AgreementAttempt';
import { BaseQuorumSet } from '../node/BaseQuorumSet';
import { QuorumSet } from './QuorumSet';
import { PublicKey } from '..';
import { AgreementAttemptCreated } from './event/AgreementAttemptCreated';
import { Voted } from './event/Voted';
import { ConsensusReached } from './event/ConsensusReached';
import { EventCollector } from '../core/EventCollector';
import { AddedVoteToAgreementAttempt } from './agreement-attempt/event/AddedVoteToAgreementAttempt';

export class FederatedVote extends EventCollector {
	private agreementAttempts: Map<Statement, AgreementAttempt> = new Map();
	private _nodeHasVotedForAStatement = false;
	private consensus: Statement | null = null;
	private node: Node;
	private registeredVotes: Set<Vote> = new Set();

	constructor(publicKey: PublicKey, quorumSet: BaseQuorumSet) {
		super();
		this.node = new Node(publicKey, QuorumSet.fromBaseQuorumSet(quorumSet));
	}

	//vote(statement)
	voteForStatement(statement: Statement): void {
		if (this._nodeHasVotedForAStatement) return;

		const vote = new Vote(
			statement,
			false,
			this.node.publicKey,
			this.node.quorumSet.toBaseQuorumSet()
		);
		this._nodeHasVotedForAStatement = true;
		this.registerEvent(new Voted(this.node.publicKey, vote));

		this.processVote(vote);
	}

	//vote(accept(statement))
	private voteToAcceptStatement(statement: Statement) {
		const vote = new Vote(
			statement,
			true,
			this.node.publicKey,
			this.node.quorumSet.toBaseQuorumSet()
		);
		this.registerEvent(new Voted(this.node.publicKey, vote));
		this.processVote(vote);
	}

	processVote(vote: Vote): void {
		if (this.registeredVotes.has(vote)) return; //because we are doing everything in memory, this check suffices and we don't need hashes
		this.registerVote(vote);

		let agreementAttempt = this.agreementAttempts.get(vote.statement);
		if (!agreementAttempt) {
			agreementAttempt = this.createAgreementAttempt(vote.statement);
		}

		this.addVoteToAgreementAttempt(agreementAttempt, vote);

		if (agreementAttempt.tryMoveToAcceptPhase()) {
			this.registerEvents(agreementAttempt.drainEvents());
			this.voteToAcceptStatement(agreementAttempt.statement);
		}

		if (agreementAttempt.tryMoveToConfirmPhase()) {
			this.registerEvents(agreementAttempt.drainEvents());

			this.consensus = agreementAttempt.statement;
			this.registerEvent(
				new ConsensusReached(this.node.publicKey, agreementAttempt.statement)
			);
		}

		//this.registerEvent(new ProcessedVote(vote));
	}

	nodeHasVotedForAStatement(): boolean {
		return this._nodeHasVotedForAStatement;
	}

	private createAgreementAttempt(statement: Statement): AgreementAttempt {
		const agreementAttempt = AgreementAttempt.create(this.node, statement);
		this.agreementAttempts.set(statement, agreementAttempt);
		this.registerEvent(
			new AgreementAttemptCreated(this.node.publicKey, statement)
		);

		return agreementAttempt;
	}

	private registerVote(vote: Vote) {
		this.registeredVotes.add(vote);
		//this.registerEvent(new RegisteredVote(vote));
	}

	getConsensus(): Statement | null {
		return this.consensus;
	}

	hasConsensus(): boolean {
		return this.consensus !== null;
	}

	getAgreementAttempts(): AgreementAttempt[] {
		return Array.from(this.agreementAttempts.values());
	}

	updateQuorumSet(quorumSet: BaseQuorumSet): void {
		this.node.updateQuorumSet(QuorumSet.fromBaseQuorumSet(quorumSet));
	}

	getNode(): Node {
		return this.node;
	}

	private addVoteToAgreementAttempt(
		agreementAttempt: AgreementAttempt,
		vote: Vote
	) {
		if (vote.accept)
			agreementAttempt.addVotedToAcceptStatement(
				vote.publicKey,
				QuorumSet.fromBaseQuorumSet(vote.quorumSet)
			);
		else
			agreementAttempt.addVotedForStatement(
				vote.publicKey,
				QuorumSet.fromBaseQuorumSet(vote.quorumSet)
			);

		//todo: move to AgreementAttempt
		this.registerEvent(
			new AddedVoteToAgreementAttempt(
				agreementAttempt.node.publicKey,
				agreementAttempt.statement,
				vote,
				agreementAttempt.phase
			)
		);
	}
}
