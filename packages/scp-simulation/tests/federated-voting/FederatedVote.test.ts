import { FederatedVote } from '../../src/federated-voting/FederatedVote';
import { Vote } from '../../src/federated-voting/Vote';
import { BaseQuorumSet } from '../../src/node/BaseQuorumSet';
import { Voted } from '../../src/federated-voting/event/Voted';
import { AgreementAttemptCreated } from '../../src/federated-voting/event/AgreementAttemptCreated';
import { AddedVoteToAgreementAttempt } from '../../src/federated-voting';
import exp from 'constants';

describe('FederatedVote', () => {
	describe('voteForStatement', () => {
		it('should do nothing if the node has already voted for a statement', () => {
			const federatedVote = new FederatedVote('V', {
				threshold: 1,
				validators: ['Q'],
				innerQuorumSets: []
			});

			const statement = 'statement';
			federatedVote.voteForStatement(statement);
			federatedVote.drainEvents();
			federatedVote.voteForStatement(statement);
			expect(federatedVote.drainEvents().length).toBe(0);
		});

		it('should vote and start a new agreement attempt', () => {
			const quorumSet: BaseQuorumSet = {
				threshold: 1,
				validators: ['OTHER'],
				innerQuorumSets: []
			};
			const federatedVote = new FederatedVote('V', quorumSet);

			const statement = 'statement';

			federatedVote.voteForStatement(statement);
			const events = federatedVote.drainEvents();
			expect(events.length).toBe(3);

			const votedEvent = events[0];
			expect(votedEvent).toBeInstanceOf(Voted);
			if (!(votedEvent instanceof Voted)) {
				throw new Error('Expected Voted event');
			}
			const vote = votedEvent.vote;
			expect(vote).not.toBeNull();
			expect(vote.statement).toBe(statement);
			expect(vote.accept).toBe(false);
			expect(vote.publicKey).toBe('V');
			expect(vote.quorumSet).toStrictEqual(quorumSet);
			expect(federatedVote.nodeHasVotedForAStatement()).toBe(true);

			const agreementAttemptCreatedEvent = events[1];
			expect(agreementAttemptCreatedEvent).toBeInstanceOf(
				AgreementAttemptCreated
			);

			const voteAddedToAgreementAttemptEvent = events[2];
			expect(voteAddedToAgreementAttemptEvent).toBeInstanceOf(
				AddedVoteToAgreementAttempt
			);
			if (
				!(
					voteAddedToAgreementAttemptEvent instanceof
					AddedVoteToAgreementAttempt
				)
			) {
				throw new Error('Expected AddedVoteToAgreementAttempt event');
			}
			expect(voteAddedToAgreementAttemptEvent.statement).toBe(statement);

			const agreementAttempts = federatedVote.getAgreementAttempts();
			expect(agreementAttempts.length).toBe(1);

			const agreementAttempt = agreementAttempts[0];
			expect(agreementAttempt.statement).toBe(statement);
			expect(agreementAttempt.phase).toBe('unknown');
			expect(agreementAttempt.node.publicKey).toBe('V');
		});

		describe('processVote', () => {
			const quorumSet: BaseQuorumSet = {
				threshold: 1,
				validators: ['Q'],
				innerQuorumSets: []
			};

			it('should start an agreement attempt', () => {
				const federatedVote = new FederatedVote('V', quorumSet);

				const vote = new Vote('statement', false, 'V', quorumSet);

				federatedVote.processVote(vote);

				const agreementAttempts = federatedVote.getAgreementAttempts();
				expect(agreementAttempts.length).toBe(1);
				const agreementAttempt = agreementAttempts[0];
				expect(agreementAttempt.statement).toBe('statement');
				expect(agreementAttempt.node.publicKey).toBe('V');
			});

			it('should resume work on existing agreement attempt', () => {
				const federatedVote = new FederatedVote('V', quorumSet);

				const vote = new Vote('statement', false, 'V', quorumSet);
				const otherVote = new Vote('statement', false, 'Q', quorumSet);

				federatedVote.processVote(vote);
				federatedVote.processVote(otherVote);

				const agreementAttempts = federatedVote.getAgreementAttempts();
				expect(agreementAttempts.length).toBe(1);

				const agreementAttempt = agreementAttempts[0];
				expect(agreementAttempt.statement).toBe('statement');
				expect(agreementAttempt.node.publicKey).toBe('V');
			});

			it('should move to accept phase', () => {
				const federatedVote = new FederatedVote('V', {
					threshold: 1,
					validators: ['Q'],
					innerQuorumSets: []
				});

				const vote = new Vote('statement', false, 'V', quorumSet);
				federatedVote.processVote(vote);

				const voteThatTriggersAccept = new Vote(
					'statement',
					false,
					'Q',
					quorumSet
				);

				federatedVote.processVote(voteThatTriggersAccept);
				const events = federatedVote.drainEvents();
				expect(events.length).toBe(7);

				const votedEvent = events.find((event) => event instanceof Voted);
				expect(votedEvent).toBeInstanceOf(Voted);
				if (!(votedEvent instanceof Voted)) {
					throw new Error('Expected Voted event');
				}

				const voteForAccept = votedEvent.vote;

				expect(voteForAccept).not.toBeNull();
				expect(voteForAccept?.accept).toBe(true);

				const agreementAttempts = federatedVote.getAgreementAttempts();
				expect(agreementAttempts.length).toBe(1);
				const agreementAttempt = agreementAttempts[0];
				expect(agreementAttempt.phase).toBe('accepted');
				expect(Array.from(agreementAttempt.getAcceptVotes().keys())).toEqual([
					'V'
				]);
			});

			it('should move to confirm phase', () => {
				const federatedVote = new FederatedVote('V', quorumSet);

				const vote = new Vote('statement', false, 'V', quorumSet);
				federatedVote.processVote(vote);

				const voteThatTriggersAccept = new Vote(
					'statement',
					false,
					'Q',
					quorumSet
				);
				federatedVote.processVote(voteThatTriggersAccept);

				const voteThatTriggersConfirm = new Vote(
					'statement',
					true,
					'Q',
					quorumSet
				);
				federatedVote.processVote(voteThatTriggersConfirm);

				const agreementAttempts = federatedVote.getAgreementAttempts();
				expect(agreementAttempts.length).toBe(1);
				const agreementAttempt = agreementAttempts[0];
				expect(agreementAttempt.phase).toBe('confirmed');

				expect(federatedVote.hasConsensus()).toBe(true);
				expect(federatedVote.getConsensus()).toBe('statement');
			});
		});
	});
});
