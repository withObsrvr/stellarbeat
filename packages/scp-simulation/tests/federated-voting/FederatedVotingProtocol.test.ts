import { Vote } from '../../src/federated-voting/Vote';
import { QuorumSet } from '../../src/node/QuorumSet';
import { Voted } from '../../src/federated-voting/event/Voted';
import { FederatedVotingProtocol } from '../../src/federated-voting/FederatedVotingProtocol';
import {
	FederatedVotingPhase,
	FederatedVotingState
} from '../../src/federated-voting/FederatedVotingState';
import { PhaseTransitioner } from '../../src/federated-voting/phase-transitioner/PhaseTransitioner';
import {
	AcceptVoteRatified,
	ConsensusReached,
	TransitionedToConfirmPhase,
	VoteRatified
} from '../../src/federated-voting';
import { TransitionedToAcceptPhase } from '../../src/federated-voting/phase-transitioner/event/TransitionedToAcceptPhase';

describe('FederatedVotingProtocol', () => {
	describe('voteForStatement', () => {
		const federatedVotingProtocol = new FederatedVotingProtocol(
			new PhaseTransitioner()
		);
		it('should do nothing if the node has already voted for a statement', () => {
			const federatedVotingState = new FederatedVotingState('V', {
				threshold: 1,
				validators: ['Q'],
				innerQuorumSets: []
			});

			const statement = 'statement';
			federatedVotingProtocol.vote(statement, federatedVotingState);
			federatedVotingProtocol.drainEvents();
			federatedVotingProtocol.vote(statement, federatedVotingState);
			expect(federatedVotingProtocol.drainEvents().length).toBe(0);
		});

		it('should vote', () => {
			const quorumSet: QuorumSet = {
				threshold: 1,
				validators: ['OTHER'],
				innerQuorumSets: []
			};
			const federatedVotingState = new FederatedVotingState('V', quorumSet);

			const statement = 'statement';

			federatedVotingProtocol.vote(statement, federatedVotingState);
			const events = federatedVotingProtocol.drainEvents();
			expect(events.length).toBe(1);

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
			expect(federatedVotingState.voted).not.toBeNull();
			expect(federatedVotingState.voted).toStrictEqual(vote);
			expect(federatedVotingState.accepted).toBeNull();
			expect(federatedVotingState.phase).toBe('unknown');
		});

		describe('processVote', () => {
			const quorumSet: QuorumSet = {
				threshold: 1,
				validators: ['Q'],
				innerQuorumSets: []
			};

			it('should register vote', () => {
				const federatedVotingState = new FederatedVotingState('V', quorumSet);
				const vote = new Vote('statement', false, 'V', quorumSet);
				federatedVotingProtocol.processVote(vote, federatedVotingState);
				expect(federatedVotingState.knownVotes.has(vote)).toBe(true);
			});

			it('should move to accept phase', () => {
				const federatedVotingState = new FederatedVotingState('V', {
					threshold: 1,
					validators: ['Q'],
					innerQuorumSets: []
				});

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
				expect(events.length).toBe(3);

				const votedEvent = events.find((event) => event instanceof Voted);
				expect(votedEvent).toBeInstanceOf(Voted);
				if (!(votedEvent instanceof Voted)) {
					throw new Error('Expected Voted event');
				}

				const voteForAccept = votedEvent.vote;

				expect(voteForAccept).not.toBeNull();
				expect(voteForAccept?.isVoteToAccept).toBe(true);
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
				const federatedVotingState = new FederatedVotingState('V', quorumSet);

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
