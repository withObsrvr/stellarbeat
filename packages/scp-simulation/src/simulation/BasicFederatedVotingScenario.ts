import { Node, QuorumSet } from '../core';
import { VoteOnStatement } from '../federated-voting';
import { Simulation } from './Simulation';

//this will be removed. Simulation is not allowed to use federated-voting. Thus Scenario should be separate package
export class BasicFederatedVotingScenario {
	static load(simulation: Simulation): void {
		const quorumSet = new QuorumSet(2, ['Alice', 'Bob', 'Chad'], []);
		const alice = new Node('Alice', quorumSet);
		const bob = new Node('Bob', quorumSet);
		const chad = new Node('Chad', quorumSet);
		const steve = new Node('Steve', new QuorumSet(2, ['Bob', 'Chad'], []));
		simulation.loadInitialNodes([alice, bob, chad, steve]);

		simulation.addUserAction(new VoteOnStatement('Alice', 'pizza'));
		simulation.addUserAction(new VoteOnStatement('Bob', 'pizza'));
		simulation.addUserAction(new VoteOnStatement('Chad', 'burger'));
		simulation.addUserAction(new VoteOnStatement('Steve', 'burger'));
	}
}
