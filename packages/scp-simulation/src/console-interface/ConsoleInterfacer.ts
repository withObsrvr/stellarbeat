import * as readline from 'readline';
import {
	Simulation,
	FederatedVotingScenarioFactory,
	ScenarioLoader
} from '../simulation';
import { ConsoleAdjacencyMatrixVisualization } from './ConsoleAdjacencyMatrixVisualizer';
import { QuorumSet } from '../core';
import {
	FederatedVotingContext,
	FederatedVotingContextFactory
} from '../federated-voting';

export class ConsoleInterfacer {
	private rl: readline.Interface;
	private simulation: Simulation;
	private federatedVotingContext: FederatedVotingContext; //todo: could me made more generic, but not a priority right now

	constructor(
		private consoleAdjacencyMatrixVisualizer: ConsoleAdjacencyMatrixVisualization,
		private scenarioLoader: ScenarioLoader
	) {
		this.federatedVotingContext = FederatedVotingContextFactory.create();
		this.simulation = new Simulation(this.federatedVotingContext);

		this.rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});

		console.log('Welcome to the Stellar Federated Voting Protocol simulation.');
		console.log('------------------------------------------------------------');

		this.showCommands();
		console.log(''); // empty line
		this.rl.setPrompt('Enter command: \n> ');
		this.rl.prompt();

		this.rl
			.on('line', (input: string) => {
				this.handleCommand(input);
				this.rl.prompt();
			})
			.on('close', () => {
				console.log('Simulation ended.');
				process.exit(0);
			});
	}

	private showNodeConnections(): void {
		this.consoleAdjacencyMatrixVisualizer.visualize(
			this.federatedVotingContext.overlayConnections
		);
	}

	private showNodeTrustConnections(): void {
		const nodesWithQuorumSets =
			this.federatedVotingContext.publicKeysWithQuorumSets;
		const getQuorumSetMembers: (quorumSet: QuorumSet) => string[] = (
			quorumSet: QuorumSet
		) => {
			return quorumSet.validators.concat(
				quorumSet.innerQuorumSets.map(getQuorumSetMembers).flat()
			);
		};
		this.consoleAdjacencyMatrixVisualizer.visualize(
			nodesWithQuorumSets.map((node) => ({
				publicKey: node.publicKey,
				connections: getQuorumSetMembers(node.quorumSet)
			}))
		);
	}

	/**
	 * @todo: implement autoplay
	 */
	private showCommands(): void {
		console.log(''); // empty line
		console.log('-- Available commands --');
		console.log('*) start: Start the simulation with a default scenario');
		console.log('*) next: Proceed to the next step in the simulation');
		console.log('*) list: Show available commands');
		console.log('*) vote PublicKey Statement: Vote on a statement');
		console.log(
			'*) nodes:list --qsets > List all nodes in the simulation, optionally showing their quorum sets'
		);
		console.log(
			'*) nodes:inspect PublicKey --qset > show node information, optionally showing its quorum set'
		);
		console.log(
			'*) nodes:inspect:slices PublicKey > show the quorum slices of the specified node'
		);
		console.log(
			'*) nodes:inspect:v-blocking-sets PublicKey > show the possible VBlockingSets of the specified node'
		);
		console.log(
			'*) nodes:history PublicKey > show the output of the specified node previous step'
		);
		console.log(
			'*) connection:list > List all connections between nodes in an adjacency matrix'
		);
		console.log(
			'*) connections:add > PublicKey PublicKey: Add a connection between two nodes'
		);
		console.log(
			'*) connections:remove PublicKey PublicKey > Remove a connection between two nodes'
		);
		console.log(
			'*) nodes:add PublicKey QuorumSet > Add a node with a given public key and quorum set'
		);
		console.log(
			'*) nodes:remove PublicKey > Remove a node from the simulation (and its connections)'
		);
		console.log(
			'*) overlay:trust > Show all trust connections between nodes in an adjacency matrix'
		);
		console.log(
			'*) simulation:back > Go back to the previous step in the simulation'
		);
		console.log('*) simulation:next > Go to the next step in the simulation');
		console.log(
			'*) simulation:commands > Show the commands that will be executed in the next step'
		);
		console.log(
			'*) simulation:scenario:export > Export the current simulation scenario'
		);
		console.log(
			'*) simulation:step number > Go to a specific step in the simulation'
		);

		console.log('*) q - Quit the simulation');
	}

	private startSimulation(): void {
		console.log('\n-- Loading default scenario --\n');
		const scenario = FederatedVotingScenarioFactory.createBasicConsensus();
		const result = this.scenarioLoader.loadScenario(scenario);
		this.simulation = result.simulation;
		this.federatedVotingContext = result.protocolContext;
		console.log('Pending user actions');

		console.log("\n-- Enter 'next' to start federated consensus -- \n");
	}

	private nextStep(): void {
		this.simulation.executeStep();
	}

	private listNodes(showQSets: boolean): void {
		if (showQSets) {
			this.listNodesWithQuorumSets();
		}
		console.log(this.federatedVotingContext.nodes);
	}

	private listNodesWithQuorumSets(): void {
		console.log(this.federatedVotingContext.publicKeysWithQuorumSets);
	}

	private handleCommand(command: string): void {
		const args = command.trim().split(' ');
		switch (args[0]) {
			case 'start':
				this.startSimulation();
				break;
			case 'next':
				this.nextStep();
				break;
			case 'list':
				this.showCommands();
				break;
			case 'nodes:list':
				this.listNodes(args.includes('--qsets'));
				break;
			case 'nl':
				this.listNodes(args.includes('--qsets'));
				break;
			case 'connections:list':
				this.showNodeConnections();
				break;
			case 'cl':
				this.showNodeConnections();
				break;
			case 'overlay:trust':
				this.showNodeTrustConnections();
				break;
			case 'ot':
				this.showNodeTrustConnections();
				break;
			case 'nodes:inspect':
				this.inspectNode(args[1], args.includes('--qset'));
				break;
			case 'ni':
				this.inspectNode(args[1], args.includes('--qset'));
				break;
			case 'simulation:undo':
				this.simulation.goBackOneStep();
				break;
			case 'su':
				this.simulation.goBackOneStep();
				break;
			case 'simulation:pending-user-actions':
				console.log(this.simulation.pendingUserActions());
				break;
			case 'simulation:pending-protocol-actions':
				console.log(this.simulation.pendingProtocolActions());
				break;
			case 'q':
				console.log('Exiting simulation...');
				this.rl.close();
				break;
			default:
				console.log(
					'Invalid command. Enter "list" to see available commands.\n'
				);
		}
	}

	private inspectNode(publicKey: string, includeQSet: boolean): void {
		const nodeInfo = this.federatedVotingContext.nodes.find(
			(node) => node.publicKey === publicKey
		);
		if (nodeInfo) {
			console.log(JSON.stringify(nodeInfo, null, 2));
		} else {
			console.log(`Node with public key ${publicKey} not found.`);
		}
	}
}
