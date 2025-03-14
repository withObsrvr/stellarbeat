import { SimulationStepListSerializer } from '../serializer/SimulationStepListSerializer';
import { Scenario } from './Scenario';

export class ScenarioSerializer {
	constructor(
		private simulationStepListSerializer: SimulationStepListSerializer
	) {}

	toJSON(scenario: Scenario) {
		return {
			id: scenario.id,
			name: scenario.name,
			description: scenario.description,
			isOverlayFullyConnected: scenario.isOverlayFullyConnected,
			isOverlayGossipEnabled: scenario.isOverlayGossipEnabled,
			initialSimulationStep: this.simulationStepListSerializer.toJSON(
				scenario.initialSimulationStep
			)
		};
	}

	fromJSON(json: any): Scenario {
		return new Scenario(
			json.id,
			json.name,
			json.description,
			json.isOverlayFullyConnected,
			json.isOverlayGossipEnabled,
			this.simulationStepListSerializer.fromJSON(json.initialSimulationStep)
		);
	}
}
