import { BaseQuorumSet } from '../node/BaseQuorumSet';
import { PublicKey, Statement } from '..';
import { NodeDTO } from '../api/NodeDTO';
import { Simulation } from './Simulation';
import { VoteCommand } from './command/AddVoteCommand';
import { SimulationStep } from './SimulationStep';
import { AddNodeCommand } from './command/AddNodeCommand';
import { AddConnectionCommand } from './command/AddConnectionCommand';
import { Event } from '../core/Event';
import { ProtocolEvent } from '../federated-voting/ProtocolEvent';
import { MessageSent } from '../node/event/MessageSent';

export class SimulationPlayer {
	private executedSteps: SimulationStep[] = [];
	private simulation: Simulation = new Simulation();
	private currentSimulationStep: SimulationStep = new SimulationStep(0);
	private log: string[] = [];

	start(): void {
		this.log.push('Starting simulation');
		//todo: take a json or something for a scenario
		this.simulation = new Simulation();
		this.currentSimulationStep = new SimulationStep(0);
		this.executedSteps = [];
		this.log.push('Initialize default scenario');
		const quorumSet: BaseQuorumSet = {
			threshold: 2,
			validators: ['Alice', 'Bob', 'Chad'],
			innerQuorumSets: []
		};

		this.addNode('Alice', quorumSet);
		this.addNode('Bob', quorumSet);
		this.addNode('Chad', quorumSet);
		this.addConnection('Alice', 'Bob');
		this.addConnection('Bob', 'Chad');
		this.executeCurrentStep(); //todo: should we execute at start?
		//@todo: validation of the network connections => only known nodes or ignore?
	}

	addNode(publicKey: PublicKey, quorumSet: BaseQuorumSet): void {
		const addNodeCommand = new AddNodeCommand(publicKey, quorumSet);
		this.currentSimulationStep.addCommand(addNodeCommand);
	}

	addConnection(nodeA: PublicKey, nodeB: PublicKey): void {
		this.currentSimulationStep.addCommand(
			new AddConnectionCommand(nodeA, nodeB)
		);
	}

	public vote(publicKey: PublicKey, statement: Statement): void {
		this.currentSimulationStep.addCommand(
			new VoteCommand(publicKey, statement)
		);
	}

	next(): void {
		if (this.currentSimulationStep.id === 1) {
			//todo: replace with scenario instead of hard code
			this.vote('Alice', 'pizza');
			this.vote('Bob', 'pizza');
			this.vote('Chad', 'burger');
		}

		this.executeCurrentStepAndSendMessage();
	}

	getNextCommandsInfo(): string {
		return this.currentSimulationStep.getCommandInfo();
	}

	//sends messages after the commands are executed
	private executeCurrentStepAndSendMessage(): void {
		if (
			!this.currentSimulationStep.hasCommands() &&
			!this.simulation.hasMessages()
		) {
			this.log.push('Nothing to do');
			return;
		}

		//allow to capture new messages for the next step, because we want to first execute the commands and then deliver the queued messages
		this.simulation.moveMessagesToOutbox();
		this.executeCurrentStep();

		//log last executed events
		this.logEvents(
			this.executedSteps[this.executedSteps.length - 1].getEvents()
		);
	}

	logEvents(events: Event[]): void {
		events.forEach((event) => {
			if (event instanceof ProtocolEvent) {
				this.log.push(`[fed-vot]${event.toString()}`);
			}

			if (event instanceof MessageSent) {
				this.log.push(`[overlay]${event.toString()}`);
			}
		});
	}

	private executeCurrentStep(): void {
		const currentStepId = this.currentSimulationStep.id;
		this.currentSimulationStep.execute(this.simulation);
		this.executedSteps.push(this.currentSimulationStep);
		this.currentSimulationStep = new SimulationStep(currentStepId + 1);
	}

	public undoLastStep(): void {
		if (this.executedSteps.length === 0) {
			return;
		}
		const removedStep = this.executedSteps.pop();
		if (!removedStep) {
			return;
		}
		this.simulation = new Simulation();
		this.executedSteps.forEach((step) => step.execute(this.simulation));
		this.currentSimulationStep = new SimulationStep(removedStep.id);
	}

	get nodes(): PublicKey[] {
		return this.simulation.nodes;
	}

	getNodeInfo(publicKey: PublicKey, includeQSet = false): NodeDTO | null {
		return this.simulation.getNodeInfo(publicKey, includeQSet);
	}

	get publicKeysWithQuorumSets(): {
		publicKey: PublicKey;
		quorumSet: BaseQuorumSet;
	}[] {
		return this.simulation.publicKeysWithQuorumSets;
	}

	get nodesWithConnections(): {
		publicKey: PublicKey;
		connections: PublicKey[];
	}[] {
		return this.simulation.nodesWithConnections;
	}

	get simulationLog(): string[] {
		return this.log.slice(); //return a copy to avoid mutation
	}
}
