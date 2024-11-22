import { QuorumSet } from '../core/QuorumSet';
import { Simulation } from './Simulation';
import { FederatedVotingContext } from '../federated-voting-context/FederatedVotingContext';
import { FederatedVotingProtocol } from '../federated-voting-protocol/FederatedVotingProtocol';
import { PhaseTransitioner } from '../federated-voting-protocol/phase-transitioner/PhaseTransitioner';
import { AddNode } from '../federated-voting-context/action/user/AddNode';
import { VoteOnStatement } from '../federated-voting-context/action/user/VoteOnStatement';

export class SimulationFactory {
	create(): Simulation {
		const simulation = new Simulation(
			new FederatedVotingContext(
				new FederatedVotingProtocol(new PhaseTransitioner())
			)
		);

		//todo: move this to scenario
		const quorumSet = new QuorumSet(2, ['Alice', 'Bob', 'Chad'], []);
		simulation.initialize([
			new AddNode('Alice', quorumSet),
			new AddNode('Bob', quorumSet),
			new AddNode('Chad', quorumSet)
		]);

		simulation.addUserAction(new VoteOnStatement('Alice', 'pizza'));
		simulation.addUserAction(new VoteOnStatement('Bob', 'pizza'));
		simulation.addUserAction(new VoteOnStatement('Chad', 'burger'));

		return simulation;
	}
}
