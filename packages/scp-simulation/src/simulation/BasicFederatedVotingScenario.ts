import { QuorumSet } from '../core/QuorumSet';
import { Simulation } from './Simulation';
import { AddNode } from '../federated-voting/action/user/AddNode';
import { VoteOnStatement } from '../federated-voting/action/user/VoteOnStatement';

//this will be removed
export class BasicFederatedVotingScenario {
	load(simulation: Simulation): void {
		const quorumSet = new QuorumSet(2, ['Alice', 'Bob', 'Chad'], []);
		simulation.addUserAction(new AddNode('Alice', quorumSet));
		simulation.addUserAction(new AddNode('Bob', quorumSet));
		simulation.addUserAction(new AddNode('Chad', quorumSet));
		simulation.addUserAction(new VoteOnStatement('Alice', 'pizza'));
		simulation.addUserAction(new VoteOnStatement('Bob', 'pizza'));
		simulation.addUserAction(new VoteOnStatement('Chad', 'burger'));
	}
}
