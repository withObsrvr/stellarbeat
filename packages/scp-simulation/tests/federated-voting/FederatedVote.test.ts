import { FederatedVote } from '../../src/federated-voting/FederatedVote';
import assert from 'node:assert';
import { Vote } from '../../src/federated-voting/Vote';
import { BaseQuorumSet } from '../../src/node/BaseQuorumSet';
import { Voted } from '../../src/federated-voting/event/Voted';
import { AgreementAttemptCreated } from '../../src/federated-voting/event/AgreementAttemptCreated';
import { AddedVoteToAgreementAttempt } from '../../src/federated-voting';

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
			assert.ok(federatedVote.drainEvents().length === 0);
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
			assert.strictEqual(events.length, 3);

			const votedEvent = events[0];
			assert.ok(votedEvent instanceof Voted);
			const vote = votedEvent.vote;
			assert.strictEqual(vote?.statement, statement);
			assert.strictEqual(vote?.accept, false);
			assert.strictEqual(vote.publicKey, 'V');
			assert.deepStrictEqual(vote.quorumSet, quorumSet);
			assert.strictEqual(federatedVote.nodeHasVotedForAStatement(), true);

			const agreementAttemptCreatedEvent = events[1];
			assert.ok(
				agreementAttemptCreatedEvent instanceof AgreementAttemptCreated
			);

			const voteAddedToAgreementAttemptEvent = events[2];
			assert.ok(
				voteAddedToAgreementAttemptEvent instanceof AddedVoteToAgreementAttempt
			);
			assert.strictEqual(voteAddedToAgreementAttemptEvent.statement, statement);

			const agreementAttempts = federatedVote.getAgreementAttempts();
			assert.strictEqual(agreementAttempts.length, 1);
			const agreementAttempt = agreementAttempts[0];
			assert.strictEqual(agreementAttempt.statement, statement);
			assert.strictEqual(agreementAttempt.phase, 'unknown');
			assert.strictEqual(agreementAttempt.node.publicKey, 'V');
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
				assert.strictEqual(agreementAttempts.length, 1);
				const agreementAttempt = agreementAttempts[0];
				assert.strictEqual(agreementAttempt.statement, 'statement');
				assert.strictEqual(agreementAttempt.node.publicKey, 'V');
			});

			it('should resume work on existing agreement attempt', () => {
				const federatedVote = new FederatedVote('V', quorumSet);

				const vote = new Vote('statement', false, 'V', quorumSet);
				const otherVote = new Vote('statement', false, 'Q', quorumSet);

				federatedVote.processVote(vote);
				federatedVote.processVote(otherVote);

				const agreementAttempts = federatedVote.getAgreementAttempts();
				assert.strictEqual(agreementAttempts.length, 1);
				const agreementAttempt = agreementAttempts[0];
				assert.strictEqual(agreementAttempt.statement, 'statement');
				assert.strictEqual(agreementAttempt.node.publicKey, 'V');
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
				assert.strictEqual(events.length, 7);

				const votedEvent = events.find((event) => event instanceof Voted);
				assert.ok(votedEvent instanceof Voted);
				const voteForAccept = votedEvent.vote;

				assert.notStrictEqual(voteForAccept, null);
				assert.strictEqual(voteForAccept?.accept, true);

				const agreementAttempts = federatedVote.getAgreementAttempts();
				assert.strictEqual(agreementAttempts.length, 1);
				const agreementAttempt = agreementAttempts[0];
				assert.strictEqual(agreementAttempt.phase, 'accepted');
				assert.deepEqual(Array.from(agreementAttempt.getAcceptVotes().keys()), [
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
				assert.strictEqual(agreementAttempts.length, 1);
				const agreementAttempt = agreementAttempts[0];
				assert.strictEqual(agreementAttempt.phase, 'confirmed');

				assert.strictEqual(federatedVote.hasConsensus(), true);
				assert.strictEqual(federatedVote.getConsensus(), 'statement');
			});
		});
	});
});
