import {
	AcceptVoteRatified,
	Node,
	QuorumSet,
	Statement,
	VoteRatified
} from '../../../src/federated-voting';
import { AgreementAttempt } from '../../../src/federated-voting';
import { AgreementAttemptPhase } from '../../../src/federated-voting/agreement-attempt/AgreementAttempt';
import { Event } from '../../../src/core/Event';
import { AcceptVoteVBlocked } from '../../../src/federated-voting/agreement-attempt/event/AcceptVoteVBlocked';
import { AgreementAttemptMovedToAcceptPhase } from '../../../src/federated-voting/agreement-attempt/event/AgreementAttemptMovedToAcceptPhase';
import { AgreementAttemptMovedToConfirmPhase } from '../../../src/federated-voting/agreement-attempt/event/AgreementAttemptMovedToConfirmPhase';

describe('AgreementAttempt', () => {
	const setupNode = (nodeId: string) => {
		return new Node(nodeId, new QuorumSet(1, ['B'], []));
	};

	describe('tryAccept', () => {
		it('should fail if agreement attempt is not in unknown phase', () => {
			const node = setupNode('A');
			const agreementAttempt = AgreementAttempt.create(node, 'statement');
			const isSetVBlockingSpy = jest.spyOn(node.quorumSet, 'isSetVBlocking'); //to make sure it's the status of the agreement attempt that causes the fail

			isSetVBlockingSpy.mockImplementation(() => true);

			agreementAttempt.phase = AgreementAttemptPhase.accepted;

			expect(agreementAttempt.tryMoveToAcceptPhase()).toEqual(false);

			agreementAttempt.phase = AgreementAttemptPhase.confirmed;
			expect(agreementAttempt.tryMoveToAcceptPhase()).toEqual(false);
			expect(agreementAttempt.drainEvents().length).toEqual(0);
		});

		const assertAcceptVoteVBlockedEvent = (
			event: Event,
			statement: Statement,
			publicKey: string,
			vBlockingSet: Set<string>
		) => {
			expect(event instanceof AcceptVoteVBlocked).toEqual(true);
			if (event instanceof AcceptVoteVBlocked) {
				expect(event.statement).toEqual(statement);
				expect(event.publicKey).toEqual(publicKey);
				expect(event.vBlockingSet).toEqual(vBlockingSet);
			}
		};

		const assertVoteRatifiedEvent = (
			event: Event,
			statement: Statement,
			publicKey: string,
			quorum: Map<string, QuorumSet>
		) => {
			expect(event instanceof VoteRatified).toEqual(true);
			if (event instanceof VoteRatified) {
				expect(event.statement).toEqual(statement);
				expect(event.publicKey).toEqual(publicKey);
				expect(event.quorum).toEqual(quorum);
			}
		};

		const assertAgreementAttemptMovedToAcceptPhaseEvent = (
			event: Event,
			statement: Statement,
			publicKey: string,
			phase: AgreementAttemptPhase
		) => {
			expect(event instanceof AgreementAttemptMovedToAcceptPhase).toEqual(true);
			if (event instanceof AgreementAttemptMovedToAcceptPhase) {
				expect(event.statement).toEqual(statement);
				expect(event.agreementAttemptPhase).toEqual(phase);
				expect(event.publicKey).toEqual(publicKey);
			}
		};

		it('should accept if a v-blocking set of nodes has accepted the statement', () => {
			const node = setupNode('A');
			const agreementAttempt = AgreementAttempt.create(node, 'statement');

			agreementAttempt.addVotedToAcceptStatement(
				'B',
				new QuorumSet(1, ['c'], [])
			);
			agreementAttempt.addVotedToAcceptStatement(
				'C',
				new QuorumSet(1, ['B'], [])
			);
			agreementAttempt.addVotedForStatement('D', new QuorumSet(1, ['B'], []));

			const isSetVBlockingSpy = jest.spyOn(node.quorumSet, 'isSetVBlocking');

			isSetVBlockingSpy.mockImplementation(() => true);

			expect(agreementAttempt.tryMoveToAcceptPhase()).toEqual(true);
			const spyCalls = isSetVBlockingSpy.mock.calls;
			expect(spyCalls.length).toEqual(1);
			expect(spyCalls[0][0]).toEqual(['B', 'C']);
			expect(agreementAttempt.phase).toEqual('accepted');

			const events = agreementAttempt.drainEvents();
			expect(events.length).toEqual(2);
			assertAcceptVoteVBlockedEvent(
				events[0],
				'statement',
				'A',
				new Set(['B', 'C'])
			);

			assertAgreementAttemptMovedToAcceptPhaseEvent(
				events[1],
				'statement',
				'A',
				AgreementAttemptPhase.accepted
			);
		});

		it('should fail if no v-blocking set of nodes has accepted the statement and no quorum has ratified it', () => {
			const node = setupNode('A');
			const agreementAttempt = AgreementAttempt.create(node, 'statement');

			agreementAttempt.addVotedToAcceptStatement(
				'B',
				new QuorumSet(1, ['c'], [])
			);
			agreementAttempt.addVotedForStatement('C', new QuorumSet(1, ['B'], []));
			agreementAttempt.addVotedForStatement('D', new QuorumSet(1, ['B'], []));

			const isSetVBlockingSpy = jest.spyOn(node.quorumSet, 'isSetVBlocking');
			isSetVBlockingSpy.mockImplementation(() => false);

			jest.spyOn(node, 'isQuorum').mockImplementation(() => null);

			expect(agreementAttempt.tryMoveToAcceptPhase()).toEqual(false);
			const spyCalls = isSetVBlockingSpy.mock.calls;
			expect(spyCalls.length).toEqual(1);
			expect(spyCalls[0][0]).toEqual(['B']);
			expect(agreementAttempt.phase).toEqual('unknown');

			expect(agreementAttempt.drainEvents().length).toEqual(0);
		});

		it('should accept if no v-blocking set of nodes has accepted the statement but a quorum has voted for it', () => {
			const node = setupNode('A');
			const agreementAttempt = AgreementAttempt.create(node, 'statement');

			const quorumSetOfB = new QuorumSet(1, ['c'], []);
			agreementAttempt.addVotedToAcceptStatement('B', quorumSetOfB);
			const quorumSetOfC = new QuorumSet(1, ['B'], []);
			agreementAttempt.addVotedForStatement('C', quorumSetOfC);
			const quorumSetOfD = new QuorumSet(1, ['B'], []);
			agreementAttempt.addVotedForStatement('D', quorumSetOfD);

			jest
				.spyOn(node.quorumSet, 'isSetVBlocking')
				.mockImplementation(() => false);

			const containsQuorumForVSpy = jest.spyOn(node, 'isQuorum');
			containsQuorumForVSpy.mockImplementation(
				() =>
					new Map([
						['B', quorumSetOfB],
						['C', quorumSetOfC]
					])
			);

			expect(agreementAttempt.tryMoveToAcceptPhase()).toEqual(true);
			const spyCalls = containsQuorumForVSpy.mock.calls;
			expect(spyCalls.length).toEqual(1);
			expect(spyCalls[0]).toEqual([
				new Map([
					['B', quorumSetOfB],
					['C', quorumSetOfC],
					['D', quorumSetOfD]
				])
			]);
			expect(agreementAttempt.phase).toEqual('accepted');

			const events = agreementAttempt.drainEvents();
			expect(events.length).toEqual(2);
			assertVoteRatifiedEvent(
				events[0],
				'statement',
				'A',
				new Map([
					['B', quorumSetOfB],
					['C', quorumSetOfC]
				])
			);
			assertAgreementAttemptMovedToAcceptPhaseEvent(
				events[1],
				'statement',
				'A',
				AgreementAttemptPhase.accepted
			);
		});
	});
	describe('tryToMoveToConfirmPhase', () => {
		const assertAcceptVoteRatifiedEvent = (
			event: Event,
			statement: Statement,
			publicKey: string,
			quorum: Map<string, QuorumSet>
		) => {
			expect(event instanceof AcceptVoteRatified).toEqual(true);

			if (event instanceof AcceptVoteRatified) {
				expect(event.statement).toEqual(statement);
				expect(event.publicKey).toEqual(publicKey);
				expect(event.quorum).toEqual(quorum);
			}
		};

		const assertAgreementAttemptMovedToConfirmPhaseEvent = (
			event: Event,
			statement: Statement,
			publicKey: string,
			phase: AgreementAttemptPhase
		) => {
			expect(event instanceof AgreementAttemptMovedToConfirmPhase).toEqual(
				true
			);
			if (event instanceof AgreementAttemptMovedToConfirmPhase) {
				expect(event.statement).toEqual(statement);
				expect(event.agreementAttemptPhase).toEqual(phase);
				expect(event.publicKey).toEqual(publicKey);
			}
		};

		it('should fail if agreement attempt is already in confirmed phase', () => {
			const node = setupNode('A');
			const agreementAttempt = AgreementAttempt.create(node, 'statement');
			agreementAttempt.phase = AgreementAttemptPhase.confirmed;
			const isQuorumSpy = jest.spyOn(node, 'isQuorum');
			isQuorumSpy.mockImplementation(
				() => new Map([['A', new QuorumSet(1, ['B'], [])]])
			);

			expect(agreementAttempt.tryMoveToConfirmPhase()).toEqual(false);
			expect(agreementAttempt.phase).toEqual('confirmed');
			expect(isQuorumSpy.mock.calls.length).toEqual(0);
			expect(agreementAttempt.drainEvents().length).toEqual(0);
		});

		it('should fail if vote(accept) is not ratified', () => {
			const node = setupNode('A');
			const agreementAttempt = AgreementAttempt.create(node, 'statement');

			const quorumSetOfB = new QuorumSet(1, ['c'], []);
			agreementAttempt.addVotedForStatement('B', quorumSetOfB);
			const quorumSetOfC = new QuorumSet(1, ['B'], []);
			agreementAttempt.addVotedToAcceptStatement('C', quorumSetOfC);

			const isQuorumSpy = jest.spyOn(node, 'isQuorum');
			isQuorumSpy.mockReturnValue(null);

			expect(agreementAttempt.tryMoveToConfirmPhase()).toEqual(false);
			const calls = isQuorumSpy.mock.calls;
			expect(calls.length).toEqual(1);
			expect(calls[0][0]).toEqual(new Map([['C', quorumSetOfC]]));
			expect(agreementAttempt.phase).toEqual('unknown');

			expect(agreementAttempt.drainEvents().length).toEqual(0);
		});

		it('should move to confirm phase if agreement attempt is ratified', () => {
			const node = setupNode('A');
			const agreementAttempt = AgreementAttempt.create(node, 'statement');

			agreementAttempt.addVotedToAcceptStatement(
				'B',
				new QuorumSet(1, ['c'], [])
			);
			agreementAttempt.addVotedToAcceptStatement(
				'C',
				new QuorumSet(1, ['B'], [])
			);

			const isQuorumSpy = jest.spyOn(node, 'isQuorum');
			isQuorumSpy.mockImplementation(
				() => new Map([['C', new QuorumSet(1, ['B'], [])]])
			);

			expect(agreementAttempt.tryMoveToConfirmPhase()).toEqual(true);
			const calls = isQuorumSpy.mock.calls;
			expect(calls.length).toEqual(1);
			expect(agreementAttempt.phase).toEqual('confirmed');

			const events = agreementAttempt.drainEvents();
			expect(events.length).toEqual(2);

			assertAcceptVoteRatifiedEvent(
				events[0],
				'statement',
				'A',
				new Map([['C', new QuorumSet(1, ['B'], [])]])
			);

			assertAgreementAttemptMovedToConfirmPhaseEvent(
				events[1],
				'statement',
				'A',
				AgreementAttemptPhase.confirmed
			);
		});
	});
});
