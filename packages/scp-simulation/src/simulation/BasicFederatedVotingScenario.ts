import { QuorumSet } from '../core';
import { AddNode, VoteOnStatement } from '../federated-voting';
import { Simulation } from './Simulation';

//this will be removed. Simulation is not allowed to use federated-voting. Thus Scenario should be separate package
export class BasicFederatedVotingScenario {
	static load(simulation: Simulation): void {
		const quorumSet = new QuorumSet(2, ['Alice', 'Bob', 'Chad'], []);
		simulation.addUserAction(new AddNode('Alice', quorumSet));
		simulation.addUserAction(new AddNode('Bob', quorumSet));
		simulation.addUserAction(new AddNode('Chad', quorumSet));
		simulation.addUserAction(new VoteOnStatement('Alice', 'pizza'));
		simulation.addUserAction(new VoteOnStatement('Bob', 'pizza'));
		simulation.addUserAction(new VoteOnStatement('Chad', 'burger'));
	}
}
