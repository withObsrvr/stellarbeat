import { SimulationStepListSerializer } from '../SimulationStepListSerializer';
import { SimulationStepSerializer } from '../SimulationStepSerializer';
import { SimulationStep } from '../../Simulation';
import { MockProxy, mock } from 'jest-mock-extended';

describe('SimulationStepListSerializer', () => {
	let mockStepSerializer: MockProxy<SimulationStepSerializer>;
	let serializer: SimulationStepListSerializer;

	beforeEach(() => {
		mockStepSerializer = mock<SimulationStepSerializer>();
		serializer = new SimulationStepListSerializer(mockStepSerializer);
	});

	describe('toJSON', () => {
		it('should serialize multiple simulation steps', () => {
			const step3 = { nextStep: null } as SimulationStep;
			const step2 = { nextStep: step3 } as SimulationStep;
			const step1 = { nextStep: step2 } as SimulationStep;

			mockStepSerializer.toJSON.mockImplementation((step) => {
				if (step === step1) return { id: '1' } as any;
				if (step === step2) return { id: '2' } as any;
				if (step === step3) return { id: '3' } as any;
				return {};
			});

			// Act
			const result = serializer.toJSON(step1);

			// Assert
			expect(result).toEqual([{ id: '1' }, { id: '2' }, { id: '3' }]);
			expect(mockStepSerializer.toJSON).toHaveBeenCalledTimes(3);
		});
	});

	describe('fromJSON', () => {
		it('should deserialize an empty array', () => {
			expect(() => serializer.fromJSON([])).toThrow();
		});

		it('should deserialize multiple simulation steps and link them', () => {
			const serializedSteps = [{ id: '1' }, { id: '2' }, { id: '3' }] as any;
			const step1 = { nextStep: null, previousStep: null } as SimulationStep;
			const step2 = { nextStep: null, previousStep: null } as SimulationStep;
			const step3 = { nextStep: null, previousStep: null } as SimulationStep;

			mockStepSerializer.fromJSON.mockImplementation((stepJson) => {
				if ((stepJson as any).id === '1') return step1;
				if ((stepJson as any).id === '2') return step2;
				if ((stepJson as any).id === '3') return step3;
				return {} as SimulationStep;
			});

			const result = serializer.fromJSON(serializedSteps);

			expect(result).toBe(step1);
			expect(step1.nextStep).toBe(step2);
			expect(step2.previousStep).toBe(step1);
			expect(step2.nextStep).toBe(step3);
			expect(step3.previousStep).toBe(step2);
			expect(step3.nextStep).toBeNull();
			expect(mockStepSerializer.fromJSON).toHaveBeenCalledTimes(3);
		});
	});
});
