import { Statement } from '../Statement';
import { EventCollector } from '../../core/EventCollector';
import { TransitionedToAcceptPhase } from './event/TransitionedToAcceptPhase';
import { VoteRatified } from './event/VoteRatified';
import { AcceptVoteRatified } from './event/AcceptVoteRatified';
import { AcceptVoteVBlocked } from './event/AcceptVoteVBlocked';
import { TransitionedToConfirmPhase } from './event/TransitionedToConfirmPhase';
import {
	FederatedVotingPhase,
	FederatedVotingState
} from '../FederatedVotingState';
import { Vote } from '../Vote';
import { QuorumSetService } from '../QuorumSetService';
import { QuorumSet } from '../../node/QuorumSet';
import { QuorumService } from '../QuorumService';

export class PhaseTransitioner extends EventCollector {
	tryMoveToAcceptPhase(
		statement: Statement,
		state: FederatedVotingState
	): boolean {
		if (state.phase !== FederatedVotingPhase.unknown) {
			return false;
		}

		const votesToAcceptStatement = this.filterVotesToAccept(state, statement);

		if (
			this.areAcceptingNodesVBlocking(
				state.quorumSet,
				votesToAcceptStatement.map((vote) => vote.publicKey)
			)
		) {
			this.registerEvent(
				new AcceptVoteVBlocked(
					state.publicKey,
					statement,
					new Set(votesToAcceptStatement.map((vote) => vote.publicKey))
				)
			);
			state.phase = FederatedVotingPhase.accepted;
			state.accepted = statement;

			this.registerEvent(
				new TransitionedToAcceptPhase(
					state.publicKey,
					state.phase,
					state.accepted
				)
			);
			return true;
		}

		const votesForStatement = this.filterVotesForStatement(state, statement);

		const quorumOrNull = this.isVoteRatified(
			state,
			statement,
			votesForStatement
		);
		if (quorumOrNull !== null) {
			state.phase = FederatedVotingPhase.accepted;
			state.accepted = statement;

			this.registerEvent(
				new VoteRatified(state.publicKey, statement, quorumOrNull)
			);

			this.registerEvent(
				new TransitionedToAcceptPhase(
					state.publicKey,
					state.phase,
					state.accepted
				)
			);
			return true;
		}

		return false;
	}

	tryMoveToConfirmPhase(
		statement: Statement,
		state: FederatedVotingState
	): boolean {
		if (state.phase === FederatedVotingPhase.confirmed) {
			return false;
		}

		const votesToAcceptStatement = this.filterVotesToAccept(state, statement);

		const quorumOrNull = this.isVoteRatified(
			state,
			statement,
			votesToAcceptStatement
		);
		if (quorumOrNull !== null) {
			state.phase = FederatedVotingPhase.confirmed;
			this.registerEvent(
				new AcceptVoteRatified(state.publicKey, statement, quorumOrNull)
			);
			this.registerEvent(
				new TransitionedToConfirmPhase(state.publicKey, state.phase, statement)
			);
			return true;
		}

		return false;
	}

	private areAcceptingNodesVBlocking(
		quorumSet: QuorumSet,
		acceptVotes: string[]
	): boolean {
		return QuorumSetService.isSetVBlocking(acceptVotes, quorumSet);
	}

	private isVoteRatified(
		state: FederatedVotingState,
		statement: Statement,
		votes: Vote[]
	): Map<string, QuorumSet> | null {
		const quorumCandidate = new Map<string, QuorumSet>();
		votes.forEach((vote) => {
			quorumCandidate.set(vote.publicKey, vote.quorumSet);
		});
		const quorumOrNull = QuorumService.isQuorum(
			state.publicKey,
			state.quorumSet,
			quorumCandidate
		);

		return quorumOrNull;
	}

	private filterVotesForStatement(
		state: FederatedVotingState,
		statement: Statement
	) {
		return Array.from(state.knownVotes).filter(
			(v) =>
				v.statement.toString() === statement.toString() && !v.isVoteToAccept
		);
	}

	private filterVotesToAccept(
		state: FederatedVotingState,
		statement: Statement
	) {
		return Array.from(state.knownVotes).filter(
			(v) => v.statement.toString() === statement.toString() && v.isVoteToAccept
		);
	}
}
