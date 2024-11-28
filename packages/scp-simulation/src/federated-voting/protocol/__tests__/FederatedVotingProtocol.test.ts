import { Vote } from '../Vote';
import { Voted } from '../event/Voted';
import { FederatedVotingProtocol } from '../FederatedVotingProtocol';
import {
	FederatedVotingPhase,
	FederatedVotingProtocolState
} from '../FederatedVotingProtocolState';
import { PhaseTransitioner } from '../phase-transitioner/PhaseTransitioner';
import {
	AcceptVoteRatified,
	ConsensusReached,
	TransitionedToConfirmPhase,
	VoteRatified
} from '../';
import { TransitionedToAcceptPhase } from '../phase-transitioner/event/TransitionedToAcceptPhase';
import { Node, QuorumSet } from '../../../core';
import { BroadcastVoteRequested } from '../event/BroadcastVoteRequested';

describe('FederatedVotingProtocol', () => {
	describe('voteForStatement', () => {
		const federatedVotingProtocol = new FederatedVotingProtocol(
			new PhaseTransitioner()
		);
		it('should do nothing if the node has already voted for a statement', () => {
			const federatedVotingState = new FederatedVotingProtocolState(
				new Node('V', new QuorumSet(1, ['Q'], []))
			);

			const statement = 'statement';
			federatedVotingProtocol.vote(statement, federatedVotingState);
			federatedVotingProtocol.drainEvents();
			federatedVotingProtocol.vote(statement, federatedVotingState);
			expect(federatedVotingProtocol.drainEvents().length).toBe(0);
		});

		it('should vote', () => {
			const quorumSet: QuorumSet = new QuorumSet(1, ['OTHER'], []);
			const federatedVotingState = new FederatedVotingProtocolState(
				new Node('V', quorumSet)
			);

			const statement = 'statement';

			federatedVotingProtocol.vote(statement, federatedVotingState);
			const events = federatedVotingProtocol.drainEvents();
			expect(events.length).toBe(2);

			const votedEvent = events[0];
			expect(votedEvent).toBeInstanceOf(Voted);
			if (!(votedEvent instanceof Voted)) {
				throw new Error('Expected Voted event');
			}
			const vote = votedEvent.vote;
			expect(vote).not.toBeNull();
			expect(vote.statement).toBe(statement);
			expect(vote.isVoteToAccept).toBe(false);
			expect(vote.publicKey).toBe('V');
			expect(vote.quorumSet).toStrictEqual(quorumSet);

			const broadcastVoteRequested = events[1];
			expect(broadcastVoteRequested).not.toBeNull();
			expect(broadcastVoteRequested).toBeInstanceOf(BroadcastVoteRequested);
			if (!(broadcastVoteRequested instanceof BroadcastVoteRequested)) {
				throw new Error('Expected BroadcastVoteRequested event');
			}
			expect(broadcastVoteRequested.vote).toStrictEqual(vote);

			expect(federatedVotingState.voted).not.toBeNull();
			expect(federatedVotingState.voted).toStrictEqual(vote.statement);
			expect(federatedVotingState.accepted).toBeNull();
			expect(federatedVotingState.phase).toBe('unknown');
		});

		describe('processVote', () => {
			const quorumSet: QuorumSet = new QuorumSet(1, ['Q'], []);

			it('should register vote', () => {
				const federatedVotingState = new FederatedVotingProtocolState(
					new Node('V', quorumSet)
				);
				const vote = new Vote('statement', false, 'V', quorumSet);
				federatedVotingProtocol.processVote(vote, federatedVotingState);
				expect(federatedVotingState.processedVotes.includes(vote)).toBe(true);
			});

			it('should move to accept phase', () => {
				const federatedVotingState = new FederatedVotingProtocolState(
					new Node('V', new QuorumSet(1, ['Q'], []))
				);

				federatedVotingProtocol.vote('statement', federatedVotingState);
				federatedVotingProtocol.drainEvents();
				expect(federatedVotingState.phase).toBe('unknown');
				expect(federatedVotingProtocol.vote).not.toBeNull();

				const voteThatTriggersAccept = new Vote(
					'statement',
					false,
					'Q',
					quorumSet
				);

				federatedVotingProtocol.processVote(
					voteThatTriggersAccept,
					federatedVotingState
				);
				expect(federatedVotingState.phase).toBe(FederatedVotingPhase.accepted);
				const events = federatedVotingProtocol.drainEvents();
				expect(events.length).toBe(4);

				const votedEvent = events.find((event) => event instanceof Voted);
				expect(votedEvent).toBeInstanceOf(Voted);
				if (!(votedEvent instanceof Voted)) {
					throw new Error('Expected Voted event');
				}
				const voteForAccept = votedEvent.vote;
				expect(voteForAccept).not.toBeNull();
				expect(voteForAccept?.isVoteToAccept).toBe(true);

				const broadcastVoteRequested = events.find(
					(event) => event instanceof BroadcastVoteRequested
				);
				expect(broadcastVoteRequested).not.toBeNull();
				expect(broadcastVoteRequested).toBeInstanceOf(BroadcastVoteRequested);
				if (!(broadcastVoteRequested instanceof BroadcastVoteRequested)) {
					throw new Error('Expected BroadcastVoteRequested event');
				}
				expect(broadcastVoteRequested.vote).toStrictEqual(voteForAccept);

				expect(federatedVotingState.accepted).toEqual('statement');
				expect(federatedVotingState.phase).toBe(FederatedVotingPhase.accepted);

				expect(
					events.find((event) => event instanceof TransitionedToAcceptPhase)
				).not.toBeNull();
				expect(
					events.find((event) => event instanceof VoteRatified)
				).not.toBeNull();
			});

			it('should move to confirm phase', () => {
				const federatedVotingState = new FederatedVotingProtocolState(
					new Node('V', quorumSet)
				);

				federatedVotingProtocol.vote('statement', federatedVotingState);

				const voteThatTriggersAccept = new Vote(
					'statement',
					false,
					'Q',
					quorumSet
				);
				federatedVotingProtocol.processVote(
					voteThatTriggersAccept,
					federatedVotingState
				);
				expect(federatedVotingState.phase).toBe(FederatedVotingPhase.accepted);
				federatedVotingProtocol.drainEvents();

				const voteThatTriggersConfirm = new Vote(
					'statement',
					true,
					'Q',
					quorumSet
				);
				federatedVotingProtocol.processVote(
					voteThatTriggersConfirm,
					federatedVotingState
				);

				expect(federatedVotingState.phase).toBe(FederatedVotingPhase.confirmed);
				expect(federatedVotingState.accepted).toEqual('statement');
				expect(federatedVotingState.confirmed).toEqual('statement');

				const events = federatedVotingProtocol.drainEvents();
				expect(events.length).toBe(3);
				expect(
					events.find((event) => event instanceof TransitionedToConfirmPhase)
				).not.toBeNull();

				expect(
					events.find((event) => event instanceof AcceptVoteRatified)
				).not.toBeNull();

				expect(
					events.filter((event) => event instanceof ConsensusReached)
				).not.toBeNull();
			});
		});
	});
});
