import {
	FederatedVotingContext,
	FederatedVotingContextFactory
} from '../../federated-voting';
import { Scenario } from './Scenario';
import { Simulation } from '../Simulation';

export class ScenarioLoader {
	loadScenario(scenario: Scenario): {
		protocolContext: FederatedVotingContext;
		simulation: Simulation;
	} {
		const protocolContext = FederatedVotingContextFactory.create(
			scenario.isOverlayFullyConnected,
			scenario.isOverlayGossipEnabled
		);

		const simulation = new Simulation(
			protocolContext,
			scenario.initialSimulationStep
		);

		return {
			protocolContext,
			simulation
		};
	}
}
