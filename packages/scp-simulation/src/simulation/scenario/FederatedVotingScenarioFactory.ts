import { Node, QuorumSet } from '../../core';
import { AddNode, VoteOnStatement } from '../../federated-voting';
import { Scenario } from './Scenario';

export class FederatedVotingScenarioFactory {
	static createBasicConsensus(): Scenario {
		const quorumSet = new QuorumSet(2, ['Alice', 'Bob', 'Chad'], []);
		const steve = new Node(
			'Steve',
			new QuorumSet(2, ['Bob', 'Chad', 'Steve'], [])
		);
		const daisy = new Node(
			'Daisy',
			new QuorumSet(2, ['Steve', 'Chad', 'Daisy'], [])
		);
		const userActions = [
			new AddNode('Alice', quorumSet),
			new AddNode('Bob', quorumSet),
			new AddNode('Chad', quorumSet),
			new AddNode('Steve', steve.quorumSet),
			new AddNode('Daisy', daisy.quorumSet),
			new VoteOnStatement('Alice', 'pizza'),
			new VoteOnStatement('Bob', 'pizza'),
			new VoteOnStatement('Chad', 'burger'),
			new VoteOnStatement('Steve', 'burger'),
			new VoteOnStatement('Daisy', 'burger')
		];

		return new Scenario(
			'basic-consensus',
			'Basic consensus scenario',
			'In this scenario, nodes will reach consensus',
			true,
			false,
			{
				userActions: userActions,
				protocolActions: [],
				previousEvents: [],
				previousStep: null,
				previousStepHash: '',
				nextStep: null
			}
		);
	}

	static createStuck(): Scenario {
		const quorumSet = new QuorumSet(2, ['Alice', 'Bob', 'Chad'], []);
		const steve = new Node(
			'Steve',
			new QuorumSet(2, ['Bob', 'Chad', 'Steve'], [])
		);
		const daisy = new Node(
			'Daisy',
			new QuorumSet(2, ['Steve', 'Chad', 'Daisy'], [])
		);
		const userActions = [
			new AddNode('Alice', quorumSet),
			new AddNode('Bob', quorumSet),
			new AddNode('Chad', quorumSet),
			new AddNode('Steve', steve.quorumSet),
			new AddNode('Daisy', daisy.quorumSet),
			new VoteOnStatement('Alice', 'pizza'),
			new VoteOnStatement('Bob', 'salad'),
			new VoteOnStatement('Chad', 'burger'),
			new VoteOnStatement('Steve', 'burger'),
			new VoteOnStatement('Daisy', 'burger')
		];

		return new Scenario(
			'stuck',
			'Stuck scenario',
			'In this scenario, nodes will not reach consensus',
			true,
			false,
			{
				userActions: userActions,
				protocolActions: [],
				previousEvents: [],
				previousStep: null,
				previousStepHash: '',
				nextStep: null
			}
		);
	}
}
