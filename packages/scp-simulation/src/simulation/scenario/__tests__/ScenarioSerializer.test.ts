import { MockProxy, mock } from 'jest-mock-extended';
import { SimulationStepListSerializer } from '../../serializer/SimulationStepListSerializer';
import { Scenario } from '../Scenario';
import { ScenarioSerializer } from '../ScenarioSerializer';
import { SimulationStep } from '../../Simulation';

describe('ScenarioSerializer', () => {
	let mockStepListSerializer: MockProxy<SimulationStepListSerializer>;
	let scenarioSerializer: ScenarioSerializer;
	let mockInitialStep: SimulationStep;
	let scenario: Scenario;

	beforeEach(() => {
		mockStepListSerializer = mock<SimulationStepListSerializer>();
		scenarioSerializer = new ScenarioSerializer(mockStepListSerializer);

		mockInitialStep = {
			userActions: [],
			protocolActions: [],
			previousEvents: [],
			nextStep: null,
			previousStep: null,
			previousStepHash: ''
		} as SimulationStep;

		scenario = new Scenario(
			'test-id',
			'Test Scenario',
			'This is a test scenario',
			true,
			false,
			mockInitialStep
		);

		mockStepListSerializer.toJSON.mockReturnValue([
			{ mockStep: 'serialized' } as any
		]);
		mockStepListSerializer.fromJSON.mockReturnValue(mockInitialStep);
	});

	describe('toJSON', () => {
		it('should serialize a scenario to JSON with correct properties', () => {
			const json = scenarioSerializer.toJSON(scenario);

			expect(json).toEqual({
				serializeVersion: '1.0.0',
				id: 'test-id',
				name: 'Test Scenario',
				description: 'This is a test scenario',
				isOverlayFullyConnected: true,
				isOverlayGossipEnabled: false,
				simulationSteps: [{ mockStep: 'serialized' }]
			});

			expect(mockStepListSerializer.toJSON).toHaveBeenCalledWith(
				mockInitialStep
			);
		});
	});

	describe('fromJSON', () => {
		it('should deserialize JSON to a scenario with correct properties', () => {
			const json = {
				serializeVersion: '1.0.0',
				id: 'test-id',
				name: 'Test Scenario',
				description: 'This is a test scenario',
				isOverlayFullyConnected: true,
				isOverlayGossipEnabled: false,
				simulationSteps: [{ mockStep: 'serialized' }]
			};

			const result = scenarioSerializer.fromJSON(json);

			expect(result).toBeInstanceOf(Scenario);
			expect(result.id).toEqual('test-id');
			expect(result.name).toEqual('Test Scenario');
			expect(result.description).toEqual('This is a test scenario');
			expect(result.isOverlayFullyConnected).toEqual(true);
			expect(result.isOverlayGossipEnabled).toEqual(false);
			expect(result.initialSimulationStep).toBe(mockInitialStep);

			expect(mockStepListSerializer.fromJSON).toHaveBeenCalledWith([
				{ mockStep: 'serialized' }
			]);
		});
	});

	describe('serialization round trip', () => {
		it('should maintain scenario properties after serialization and deserialization', () => {
			mockStepListSerializer.toJSON.mockImplementation(() => [
				'serialized-step' as any
			]);
			mockStepListSerializer.fromJSON.mockImplementation(() => mockInitialStep);

			const json = scenarioSerializer.toJSON(scenario);
			const deserializedScenario = scenarioSerializer.fromJSON(json);

			expect(deserializedScenario.id).toEqual(scenario.id);
			expect(deserializedScenario.name).toEqual(scenario.name);
			expect(deserializedScenario.description).toEqual(scenario.description);
			expect(deserializedScenario.isOverlayFullyConnected).toEqual(
				scenario.isOverlayFullyConnected
			);
			expect(deserializedScenario.isOverlayGossipEnabled).toEqual(
				scenario.isOverlayGossipEnabled
			);
			expect(deserializedScenario.initialSimulationStep).toBe(mockInitialStep);
		});
	});
});
