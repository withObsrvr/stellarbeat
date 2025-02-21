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
		const steve = new Node(
			'Steve',
			new QuorumSet(2, ['Bob', 'Chad', 'Steve'], [])
		);
		const daisy = new Node(
			'Daisy',
			new QuorumSet(2, ['Steve', 'Chad', 'Daisy'], [])
		);
		simulation.loadInitialNodes([alice, bob, chad, steve, daisy]);

		simulation.addUserAction(new VoteOnStatement('Alice', 'pizza'));
		simulation.addUserAction(new VoteOnStatement('Bob', 'pizza'));
		simulation.addUserAction(new VoteOnStatement('Chad', 'burger'));
		simulation.addUserAction(new VoteOnStatement('Steve', 'burger'));
		simulation.addUserAction(new VoteOnStatement('Daisy', 'burger'));

		simulation.markScenarioStart();
	}

	static loadConsensusReached(simulation: Simulation): void {
		BasicFederatedVotingScenario.load(simulation);
	}

	static loadStuck(simulation: Simulation): void {
		const quorumSet = new QuorumSet(2, ['Alice', 'Bob', 'Chad'], []);
		const alice = new Node('Alice', quorumSet);
		const bob = new Node('Bob', quorumSet);
		const chad = new Node('Chad', quorumSet);
		const steve = new Node(
			'Steve',
			new QuorumSet(2, ['Bob', 'Chad', 'Steve'], [])
		);
		const daisy = new Node(
			'Daisy',
			new QuorumSet(2, ['Steve', 'Chad', 'Daisy'], [])
		);
		simulation.loadInitialNodes([alice, bob, chad, steve, daisy]);

		simulation.addUserAction(new VoteOnStatement('Alice', 'pizza'));
		simulation.addUserAction(new VoteOnStatement('Bob', 'salad'));
		simulation.addUserAction(new VoteOnStatement('Chad', 'burger'));
		simulation.addUserAction(new VoteOnStatement('Steve', 'burger'));
		simulation.addUserAction(new VoteOnStatement('Daisy', 'burger'));

		simulation.markScenarioStart();
	}
}
