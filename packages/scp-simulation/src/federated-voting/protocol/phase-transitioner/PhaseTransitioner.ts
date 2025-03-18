import { Statement } from '../Statement';
import { TransitionedToAcceptPhase } from './event/TransitionedToAcceptPhase';
import { VoteRatified } from './event/VoteRatified';
import { AcceptVoteRatified } from './event/AcceptVoteRatified';
import { AcceptVoteVBlocked } from './event/AcceptVoteVBlocked';
import { TransitionedToConfirmPhase } from './event/TransitionedToConfirmPhase';
import {
	FederatedVotingPhase,
	FederatedVotingProtocolState
} from '../FederatedVotingProtocolState';
import { Vote } from '../Vote';
import { QuorumSetService } from '../QuorumSetService';
import { QuorumService } from '../QuorumService';
import { InMemoryEventCollector, QuorumSet } from '../../../core';

export class PhaseTransitioner extends InMemoryEventCollector {
	tryMoveToAcceptPhase(
		statement: Statement,
		state: FederatedVotingProtocolState
	): boolean {
		if (state.phase !== FederatedVotingPhase.unknown) {
			return false;
		}

		const votesToAcceptStatement = this.filterVotesToAccept(state, statement);

		if (
			this.areAcceptingNodesVBlocking(
				state.node.quorumSet,
				votesToAcceptStatement.map((vote) => vote.publicKey)
			)
		) {
			this.registerEvent(
				new AcceptVoteVBlocked(
					state.node.publicKey,
					statement,
					new Set(votesToAcceptStatement.map((vote) => vote.publicKey))
				)
			);
			state.phase = FederatedVotingPhase.accepted;
			state.accepted = statement;

			this.registerEvent(
				new TransitionedToAcceptPhase(
					state.node.publicKey,
					state.phase,
					state.accepted
				)
			);
			return true;
		}

		const votesForStatement = this.filterVotesForStatement(state, statement);

		const quorumOrNull = this.isVoteRatified(state, votesForStatement);
		if (quorumOrNull !== null) {
			state.phase = FederatedVotingPhase.accepted;
			state.accepted = statement;

			this.registerEvent(
				new VoteRatified(state.node.publicKey, statement, quorumOrNull)
			);

			this.registerEvent(
				new TransitionedToAcceptPhase(
					state.node.publicKey,
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
		state: FederatedVotingProtocolState
	): boolean {
		if (state.phase === FederatedVotingPhase.confirmed) {
			return false;
		}

		const votesToAcceptStatement = this.filterVotesToAccept(state, statement);

		const quorumOrNull = this.isVoteRatified(state, votesToAcceptStatement);
		if (quorumOrNull !== null) {
			state.phase = FederatedVotingPhase.confirmed;
			this.registerEvent(
				new AcceptVoteRatified(state.node.publicKey, statement, quorumOrNull)
			);
			this.registerEvent(
				new TransitionedToConfirmPhase(
					state.node.publicKey,
					state.phase,
					statement
				)
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
		state: FederatedVotingProtocolState,
		votes: Vote[]
	): Map<string, QuorumSet> | null {
		const quorumCandidate = new Map<string, QuorumSet>();
		votes.forEach((vote) => {
			quorumCandidate.set(vote.publicKey, vote.quorumSet);
		});
		const quorumOrNull = QuorumService.isQuorumContainingNode(
			state.node,
			quorumCandidate
		);

		return quorumOrNull;
	}

	private filterVotesForStatement(
		state: FederatedVotingProtocolState,
		statement: Statement
	) {
		return state.processedVotes.filter(
			(v) => v.statement.toString() === statement.toString()
		);
	}

	private filterVotesToAccept(
		state: FederatedVotingProtocolState,
		statement: Statement
	) {
		return state.processedVotes.filter(
			(v) => v.statement.toString() === statement.toString() && v.isVoteToAccept
		);
	}
}
