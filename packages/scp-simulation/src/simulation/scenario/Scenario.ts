import { SimulationStep } from '../Simulation';

export class Scenario {
	id: string;
	name: string;
	description: string;
	isOverlayFullyConnected: boolean;
	isOverlayGossipEnabled: boolean;
	initialSimulationStep: SimulationStep;

	constructor(
		id: string,
		name: string,
		description: string,
		isOverlayFullyConnected: boolean,
		isOverlayGossipEnabled: boolean,
		initialSimulationStep: SimulationStep
	) {
		this.id = id;
		this.name = name;
		this.description = description;
		this.isOverlayFullyConnected = isOverlayFullyConnected;
		this.isOverlayGossipEnabled = isOverlayGossipEnabled;
		this.initialSimulationStep = initialSimulationStep;
	}
}
