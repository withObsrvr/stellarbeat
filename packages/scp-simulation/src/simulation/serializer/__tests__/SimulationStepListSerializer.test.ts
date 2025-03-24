import { SimulationStepListSerializer } from '../SimulationStepListSerializer';
import { SimulationStepSerializer } from '../SimulationStepSerializer';
import { SimulationStep } from '../../Simulation';
import { AddConnection } from '../../../overlay';

describe('SimulationStepListSerializer', () => {
	let serializer: SimulationStepListSerializer;
	const step1: SimulationStep = {
		nextStep: null,
		previousStep: null,
		userActions: [],
		protocolActions: [],
		previousEvents: [],
		previousStepHash: ''
	};
	const step2: SimulationStep = {
		nextStep: null,
		previousStep: null,
		userActions: [new AddConnection('a', 'b')],
		protocolActions: [],
		previousEvents: [],
		previousStepHash: '1364076727'
	};
	const step3: SimulationStep = {
		nextStep: null,
		previousStep: null,
		userActions: [],
		protocolActions: [],
		previousEvents: [],
		previousStepHash: '480464260'
	};
	step1.nextStep = step2;
	step2.previousStep = step1;
	step2.nextStep = step3;
	step3.previousStep = step2;

	beforeEach(() => {
		serializer = new SimulationStepListSerializer(
			new SimulationStepSerializer()
		);
	});

	describe('toJSON', () => {
		it('should serialize multiple simulation steps', () => {
			const result = serializer.toJSON(step1);
			expect(result).toEqual([
				{
					userActions: [],
					protocolActions: [],
					previousStepHash: ''
				},
				{
					userActions: [
						{
							type: 'UserAction',
							subType: 'AddConnection',
							a: 'a',
							b: 'b'
						}
					],
					protocolActions: [],
					previousStepHash: '1364076727'
				},
				{
					userActions: [],
					protocolActions: [],
					previousStepHash: '480464260'
				}
			]);
		});
	});

	describe('fromJSON', () => {
		it('should deserialize an empty array', () => {
			expect(() => serializer.fromJSON([])).toThrow();
		});

		it('should deserialize multiple simulation steps and link them', () => {
			const serialized = serializer.toJSON(step1);
			console.log(serialized);

			const sstep1 = serializer.fromJSON(serialized);
			expect(sstep1.previousEvents).toEqual([]);
			expect(sstep1.userActions).toEqual([]);
			expect(sstep1.protocolActions).toEqual([]);

			const sstep2 = sstep1.nextStep;
			expect(sstep2?.previousEvents).toEqual([]);
			expect(sstep2?.userActions).toEqual([new AddConnection('a', 'b')]);
			expect(sstep2?.protocolActions).toEqual([]);
			expect(sstep2?.previousStepHash).toEqual('1364076727');

			const sstep3 = sstep2?.nextStep;
			expect(sstep3?.previousEvents).toEqual([]);
			expect(sstep3?.userActions).toEqual([]);
			expect(sstep3?.protocolActions).toEqual([]);
			expect(sstep3?.previousStepHash).toEqual('480464260');
			expect(sstep3?.previousStep?.previousStepHash).toEqual('1364076727');
		});
	});
});
