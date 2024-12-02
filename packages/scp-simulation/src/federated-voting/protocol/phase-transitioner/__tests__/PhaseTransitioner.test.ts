import { Event, Node, QuorumSet } from '../../../../core';
import {
	FederatedVotingPhase,
	FederatedVotingProtocolState
} from '../../FederatedVotingProtocolState';
import { QuorumService } from '../../QuorumService';
import { QuorumSetService } from '../../QuorumSetService';
import { Statement } from '../../Statement';
import { Vote } from '../../Vote';
import { AcceptVoteRatified } from '../event/AcceptVoteRatified';
import { AcceptVoteVBlocked } from '../event/AcceptVoteVBlocked';
import { TransitionedToAcceptPhase } from '../event/TransitionedToAcceptPhase';
import { TransitionedToConfirmPhase } from '../event/TransitionedToConfirmPhase';
import { VoteRatified } from '../event/VoteRatified';
import { PhaseTransitioner } from '../PhaseTransitioner';

describe('PhaseTransitioner', () => {
	const phaseTransitioner = new PhaseTransitioner();

	const setupState = (publicKey: string) => {
		return new FederatedVotingProtocolState(
			new Node(publicKey, new QuorumSet(1, ['B'], []))
		);
	};

	const createStatement = () => {
		return 'statement';
	};

	describe('tryAccept', () => {
		it('should fail if agreement attempt is not in unknown phase', () => {
			const federatedVotingState = setupState('A');
			const statement = createStatement();
			federatedVotingState.voted = statement;

			const isSetVBlockingSpy = jest.spyOn(QuorumSetService, 'isSetVBlocking'); //to make sure it's the status of the agreement attempt that causes the fail
			isSetVBlockingSpy.mockImplementation(() => true);

			federatedVotingState.phase = FederatedVotingPhase.accepted;

			expect(
				phaseTransitioner.tryMoveToAcceptPhase(statement, federatedVotingState)
			).toEqual(false);

			federatedVotingState.phase = FederatedVotingPhase.confirmed;
			expect(
				phaseTransitioner.tryMoveToAcceptPhase(statement, federatedVotingState)
			).toEqual(false);
			expect(phaseTransitioner.drainEvents().length).toEqual(0);
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
			phase: FederatedVotingPhase
		) => {
			expect(event instanceof TransitionedToAcceptPhase).toEqual(true);
			if (event instanceof TransitionedToAcceptPhase) {
				expect(event.statement).toEqual(statement);
				expect(event.phase).toEqual(phase);
				expect(event.publicKey).toEqual(publicKey);
			}
		};

		it('should accept if a v-blocking set of nodes has accepted the statement', () => {
			const federatedVotingState = setupState('A');
			const statement = createStatement();
			federatedVotingState.processedVotes.push(
				new Vote(statement, true, 'B', new QuorumSet(1, ['C'], []))
			);
			federatedVotingState.processedVotes.push(
				new Vote(statement, true, 'C', new QuorumSet(1, ['B'], []))
			);

			federatedVotingState.processedVotes.push(
				new Vote(statement, false, 'D', new QuorumSet(1, ['B'], []))
			);

			const isSetVBlockingSpy = jest.spyOn(QuorumSetService, 'isSetVBlocking');

			isSetVBlockingSpy.mockImplementation(() => true);

			expect(
				phaseTransitioner.tryMoveToAcceptPhase(statement, federatedVotingState)
			).toEqual(true);
			const spyCalls = isSetVBlockingSpy.mock.calls;
			expect(spyCalls.length).toEqual(1);
			expect(spyCalls[0][0]).toEqual(['B', 'C']);
			expect(federatedVotingState.phase).toEqual(FederatedVotingPhase.accepted);

			const events = phaseTransitioner.drainEvents();
			expect(events.length).toEqual(2);
			assertAcceptVoteVBlockedEvent(
				events[0],
				statement,
				'A',
				new Set(['B', 'C'])
			);

			assertAgreementAttemptMovedToAcceptPhaseEvent(
				events[1],
				statement,
				'A',
				FederatedVotingPhase.accepted
			);
		});

		it('should fail if no v-blocking set of nodes has accepted the statement and no quorum has ratified it', () => {
			const federatedVotingState = setupState('A');
			const statement = createStatement();

			federatedVotingState.processedVotes.push(
				new Vote(statement, true, 'B', new QuorumSet(1, ['C'], []))
			);
			federatedVotingState.processedVotes.push(
				new Vote(statement, false, 'C', new QuorumSet(1, ['B'], []))
			);
			federatedVotingState.processedVotes.push(
				new Vote(statement, false, 'D', new QuorumSet(1, ['B'], []))
			);

			const isSetVBlockingSpy = jest.spyOn(QuorumSetService, 'isSetVBlocking');
			isSetVBlockingSpy.mockReset();
			isSetVBlockingSpy.mockImplementation(() => false);

			jest
				.spyOn(QuorumService, 'isQuorumContainingNode')
				.mockImplementation(() => null);

			expect(
				phaseTransitioner.tryMoveToAcceptPhase(statement, federatedVotingState)
			).toEqual(false);
			const spyCalls = isSetVBlockingSpy.mock.calls;
			expect(spyCalls.length).toEqual(1);
			expect(spyCalls[0][0]).toEqual(['B']);
			expect(federatedVotingState.phase).toEqual(FederatedVotingPhase.unknown);

			expect(phaseTransitioner.drainEvents().length).toEqual(0);
		});

		it('should accept if no v-blocking set of nodes has accepted the statement but a quorum has voted or accepted it', () => {
			const federatedVotingState = setupState('A');
			const statement = createStatement();

			const quorumSetOfB = new QuorumSet(1, ['C'], []);
			federatedVotingState.processedVotes.push(
				new Vote(statement, false, 'B', quorumSetOfB)
			);

			const quorumSetOfC = new QuorumSet(1, ['B'], []);
			federatedVotingState.processedVotes.push(
				new Vote(statement, false, 'C', quorumSetOfC)
			);

			const quorumSetOfD = new QuorumSet(1, ['B'], []);
			federatedVotingState.processedVotes.push(
				new Vote(statement, true, 'D', quorumSetOfD)
			);

			jest
				.spyOn(QuorumSetService, 'isSetVBlocking')
				.mockImplementation(() => false);

			const containsQuorumForVSpy = jest.spyOn(
				QuorumService,
				'isQuorumContainingNode'
			);
			containsQuorumForVSpy.mockReset();
			containsQuorumForVSpy.mockImplementation(
				() =>
					new Map([
						['B', quorumSetOfB],
						['C', quorumSetOfC]
					])
			);

			expect(
				phaseTransitioner.tryMoveToAcceptPhase(statement, federatedVotingState)
			).toEqual(true);
			const spyCalls = containsQuorumForVSpy.mock.calls;
			expect(spyCalls.length).toEqual(1);
			expect(spyCalls[0][1]).toEqual(
				new Map([
					['B', quorumSetOfB],
					['C', quorumSetOfC],
					['D', quorumSetOfD]
				])
			);
			expect(federatedVotingState.phase).toEqual('accepted');

			const events = phaseTransitioner.drainEvents();
			expect(events.length).toEqual(2);
			assertVoteRatifiedEvent(
				events[0],
				statement,
				'A',
				new Map([
					['B', quorumSetOfB],
					['C', quorumSetOfC]
				])
			);
			assertAgreementAttemptMovedToAcceptPhaseEvent(
				events[1],
				statement,
				'A',
				FederatedVotingPhase.accepted
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
			phase: FederatedVotingPhase
		) => {
			expect(event instanceof TransitionedToConfirmPhase).toEqual(true);
			if (event instanceof TransitionedToConfirmPhase) {
				expect(event.statement).toEqual(statement);
				expect(event.phase).toEqual(phase);
				expect(event.publicKey).toEqual(publicKey);
			}
		};

		it('should fail if agreement attempt is already in confirmed phase', () => {
			const federatedVotingState = setupState('A');
			const statement = createStatement();

			federatedVotingState.phase = FederatedVotingPhase.confirmed;
			const isQuorumSpy = jest.spyOn(QuorumService, 'isQuorumContainingNode');
			isQuorumSpy.mockReset();
			isQuorumSpy.mockImplementation(
				() => new Map([['A', new QuorumSet(1, ['B'], [])]])
			);

			expect(
				phaseTransitioner.tryMoveToConfirmPhase(statement, federatedVotingState)
			).toEqual(false);

			expect(federatedVotingState.phase).toEqual('confirmed');
			expect(isQuorumSpy.mock.calls.length).toEqual(0);
			expect(phaseTransitioner.drainEvents().length).toEqual(0);
		});

		it('should fail if vote(accept) is not ratified', () => {
			const federatedVotingState = setupState('A');
			const statement = createStatement();

			const quorumSetOfB = new QuorumSet(1, ['c'], []);
			federatedVotingState.processedVotes.push(
				new Vote(statement, false, 'B', quorumSetOfB)
			);
			const quorumSetOfC = new QuorumSet(1, ['B'], []);
			federatedVotingState.processedVotes.push(
				new Vote(statement, true, 'C', quorumSetOfC)
			);

			const isQuorumSpy = jest.spyOn(QuorumService, 'isQuorumContainingNode');
			isQuorumSpy.mockReturnValue(null);

			expect(
				phaseTransitioner.tryMoveToConfirmPhase(statement, federatedVotingState)
			).toEqual(false);
			const calls = isQuorumSpy.mock.calls;
			expect(calls.length).toEqual(1);
			expect(calls[0][1]).toEqual(new Map([['C', quorumSetOfC]]));
			expect(federatedVotingState.phase).toEqual('unknown');

			expect(phaseTransitioner.drainEvents().length).toEqual(0);
		});

		it('should move to confirm phase if agreement attempt is ratified', () => {
			const federatedVotingState = setupState('A');
			const statement = createStatement();

			federatedVotingState.processedVotes.push(
				new Vote(statement, true, 'B', new QuorumSet(1, ['C'], []))
			);

			federatedVotingState.processedVotes.push(
				new Vote(statement, true, 'C', new QuorumSet(1, ['B'], []))
			);

			const isQuorumSpy = jest.spyOn(QuorumService, 'isQuorumContainingNode');
			isQuorumSpy.mockReset();
			isQuorumSpy.mockImplementation(
				() => new Map([['C', new QuorumSet(1, ['B'], [])]])
			);

			expect(
				phaseTransitioner.tryMoveToConfirmPhase(statement, federatedVotingState)
			).toEqual(true);
			const calls = isQuorumSpy.mock.calls;
			expect(calls.length).toEqual(1);
			expect(federatedVotingState.phase).toEqual('confirmed');

			const events = phaseTransitioner.drainEvents();
			expect(events.length).toEqual(2);

			assertAcceptVoteRatifiedEvent(
				events[0],
				statement,
				'A',
				new Map([['C', new QuorumSet(1, ['B'], [])]])
			);

			assertAgreementAttemptMovedToConfirmPhaseEvent(
				events[1],
				statement,
				'A',
				FederatedVotingPhase.confirmed
			);
		});
	});
});
