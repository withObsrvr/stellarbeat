import { mock } from 'jest-mock-extended';
import { UserAction, ProtocolAction, Event, QuorumSet } from '../../../core';
import { Broadcast, Vote, VoteOnStatement } from '../../../federated-voting';
import { SimulationStep } from '../../Simulation';
import { SimulationStepSerializer } from '../SimulationStepSerializer';

describe('SimulationStepSerializer', () => {
	let userAction: UserAction;
	let protocolAction: ProtocolAction;
	let step: SimulationStep;
	const simulationStepSerializer = new SimulationStepSerializer();

	beforeEach(() => {
		userAction = new VoteOnStatement('Alice', 'pizza');
		protocolAction = new Broadcast(
			'Alice',
			new Vote('pizza', true, 'Alice', new QuorumSet(1, [], [])),
			['neighbor']
		);

		step = {
			userActions: [userAction],
			protocolActions: [protocolAction],
			previousEvents: [mock<Event>()],
			nextStep: null,
			previousStep: null,
			previousStepHash: '123456'
		};
	});

	describe('toJSON', () => {
		it('should serialize a step to JSON', () => {
			const json = simulationStepSerializer.toJSON(step);

			expect(json).toEqual({
				userActions: [userAction.toJSON()],
				protocolActions: [protocolAction.toJSON()],
				previousStepHash: '123456'
			});
		});
	});

	describe('fromJSON', () => {
		it('should deserialize JSON back to a step with correct structure', () => {
			const json = {
				userActions: [userAction.toJSON()],
				protocolActions: [protocolAction.toJSON()],
				previousStepHash: '123456'
			};

			const deserializedStep = simulationStepSerializer.fromJSON(json);

			expect(deserializedStep).toEqual({
				userActions: [userAction],
				protocolActions: [protocolAction],
				previousEvents: [],
				nextStep: null,
				previousStep: null,
				previousStepHash: '123456'
			});
		});
	});
});
