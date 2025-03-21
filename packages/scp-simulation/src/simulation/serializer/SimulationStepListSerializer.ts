import { calculateStepHash, SimulationStep } from '../Simulation';
import {
	SerializedSimulationStep,
	SimulationStepSerializer
} from './SimulationStepSerializer';

export class SimulationStepListSerializer {
	constructor(private stepSerializer: SimulationStepSerializer) {}

	toJSON(initialSimulationStep: SimulationStep): SerializedSimulationStep[] {
		let step = initialSimulationStep;
		const steps = [this.stepSerializer.toJSON(step)];
		while (step.nextStep) {
			step = step.nextStep;
			steps.push(this.stepSerializer.toJSON(step));
		}

		return steps;
	}

	fromJSON(json: SerializedSimulationStep[]): SimulationStep {
		if (json.length === 0) {
			throw new Error('Cannot deserialize empty array');
		}
		const steps = json.map((stepJson) =>
			this.stepSerializer.fromJSON(stepJson)
		);

		for (let i = 0; i < steps.length - 1; i++) {
			steps[i].nextStep = steps[i + 1];
			steps[i + 1].previousStep = steps[i];
		}

		return steps[0];
	}
}
