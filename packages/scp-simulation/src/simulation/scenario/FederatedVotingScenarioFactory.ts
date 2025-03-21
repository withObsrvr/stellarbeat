import { Node, QuorumSet } from '../../core';
import { AddNode, VoteOnStatement } from '../../federated-voting';
import { Scenario } from './Scenario';
import { ScenarioSerializer } from './ScenarioSerializer';
import acceptingSafetyScenario from './data/accepting-not-enough-safety.json';
import acceptingLivenessScenario from './data/accepting-not-enough-liveness.json';
import acceptingLivenessGossipScenario from './data/accepting-not-enough-liveness-gossip-fix.json';
import networkSplitIllBehavedNode from './data/network-split-ill-behaved-node.json';
import networkSplitProtectedSecondTier from './data/network-split-protected-second-tier.json';
import networkStuckBecauseNodes from './data/network-stuck-because-nodes.json';
import networkStuckBecauseVotes from './data/network-stuck-because-votes.json';
import networkSafeIllBehavedNode from './data/network-safe-ill-behaved-node.json';
import overlayRing from './data/overlay-ring.json';
import overlayPartition from './data/overlay-partition.json';

export class FederatedVotingScenarioFactory {
	constructor(private scenarioSerializer: ScenarioSerializer) {}

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
			'basic-agreement',
			'Successful agreement scenario',
			'In this scenario, nodes will reach agreement',
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

	public loadJSONScenario(json: any): Scenario {
		try {
			return this.scenarioSerializer.fromJSON(json);
		} catch (e: unknown) {
			if (e instanceof Error) {
				throw new Error('Failed to create scenario', { cause: e });
			}
			throw new Error('Failed to create scenario');
		}
	}

	loadAll(): Scenario[] {
		return [
			FederatedVotingScenarioFactory.createBasicConsensus(),
			this.loadJSONScenario(networkStuckBecauseVotes),
			this.loadJSONScenario(networkStuckBecauseNodes),
			this.loadJSONScenario(acceptingSafetyScenario),
			this.loadJSONScenario(acceptingLivenessScenario),
			this.loadJSONScenario(acceptingLivenessGossipScenario),
			this.loadJSONScenario(networkSplitIllBehavedNode),
			this.loadJSONScenario(networkSplitProtectedSecondTier),
			this.loadJSONScenario(networkSafeIllBehavedNode),
			this.loadJSONScenario(overlayRing),
			this.loadJSONScenario(overlayPartition)
		];
	}
}
