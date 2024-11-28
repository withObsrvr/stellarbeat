import { Statement } from './Statement';
import { Vote } from './Vote';
import { BroadcastVoteRequested } from './event/BroadcastVoteRequested';
import { Voted } from './event/Voted';
import { ConsensusReached } from './event/ConsensusReached';
import { FederatedVotingProtocolState } from './FederatedVotingProtocolState';
import { PhaseTransitioner } from './phase-transitioner/PhaseTransitioner';
import { InMemoryEventCollector } from '../../core';

export class FederatedVotingProtocol extends InMemoryEventCollector {
	constructor(private phaseTransitioner: PhaseTransitioner) {
		super();
	}

	vote(statement: Statement, state: FederatedVotingProtocolState): void {
		if (state.voted !== null) return;

		const vote = new Vote(
			statement,
			false,
			state.node.publicKey,
			state.node.quorumSet
		);
		state.voted = statement;
		this.registerEvent(new Voted(state.node.publicKey, vote));
		this.registerEvent(new BroadcastVoteRequested(state.node.publicKey, vote));
		this.processVote(vote, state);
	}

	//vote(accept(statement))
	//can only happen due to processing of a vote, thus private
	private voteToAcceptStatement(
		statement: Statement,
		state: FederatedVotingProtocolState
	) {
		const vote = new Vote(
			statement,
			true,
			state.node.publicKey,
			state.node.quorumSet
		);
		this.registerEvent(new Voted(state.node.publicKey, vote));
		this.registerEvent(new BroadcastVoteRequested(state.node.publicKey, vote));

		this.processVote(vote, state);
	}

	processVote(vote: Vote, state: FederatedVotingProtocolState): void {
		if (state.processedVotes.includes(vote)) return; //because we are doing everything in memory, this check suffices and we don't need hashes
		state.processedVotes.push(vote);

		if (this.phaseTransitioner.tryMoveToAcceptPhase(vote.statement, state)) {
			this.registerEvents(this.phaseTransitioner.drainEvents());
			this.voteToAcceptStatement(vote.statement, state);
		}

		if (this.phaseTransitioner.tryMoveToConfirmPhase(vote.statement, state)) {
			this.registerEvents(this.phaseTransitioner.drainEvents());
			state.confirmed = vote.statement;
			this.registerEvent(
				new ConsensusReached(state.node.publicKey, state.confirmed)
			);
		}
	}
}
