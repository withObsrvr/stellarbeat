import murmurhash from 'murmurhash';
import { Event, Context, UserAction, ProtocolAction, Node } from '../core';
import { ForgeMessage } from '../federated-voting';
import { AddConnection, RemoveConnection } from '../overlay';

//A step in the simulation. Contains all user and protocol actions to be executed next
//and stores the state and events that got us here.
//Linked list
export interface SimulationStep {
	userActions: UserAction[];
	protocolActions: ProtocolAction[];
	previousEvents: Event[]; //the events executed in the previous step. Todo: or store executed events? Improve naming?
	nextStep: SimulationStep | null;
	previousStep: SimulationStep | null;
	previousStepHash: string;
}

//The simulation. Works on a context and manages the user and protocol actions. Provides an eventlog, and allows to replay the simulation.
export class Simulation {
	private initialStep: SimulationStep; //handy to replay the state
	private currentStep: SimulationStep;

	constructor(
		private context: Context,
		initialStep?: SimulationStep
	) {
		if (initialStep) {
			this.initialStep = initialStep;
			this.currentStep = initialStep;
		} else {
			this.currentStep = {
				userActions: [],
				protocolActions: [],
				previousEvents: [],
				nextStep: null,
				previousStep: null,
				previousStepHash: ''
			};
			this.initialStep = this.currentStep;
		}
	}

	getFullEventLog(): Event[][] {
		const events: Event[][] = [];
		let stepIterator: SimulationStep | null = this.initialStep;
		while (
			stepIterator !== this.currentStep.nextStep &&
			stepIterator !== null
		) {
			events.push(stepIterator.previousEvents);
			stepIterator = stepIterator.nextStep;
		}
		return events;
	}

	getLatestEvents(): Event[] {
		return this.currentStep.previousEvents;
	}

	public addUserAction(action: UserAction): void {
		const existingAction = this.currentStep.userActions.find(
			(a) =>
				a.subType === action.subType &&
				a.publicKey === action.publicKey &&
				!(
					action instanceof AddConnection ||
					action instanceof RemoveConnection ||
					action instanceof ForgeMessage
				) //todo: we need a better solution! Maybe isIdempotent property?
		);
		if (existingAction) {
			const index = this.currentStep.userActions.indexOf(existingAction);
			this.currentStep.userActions[index] = action;
			return; //replace the action
		}

		this.currentStep.userActions.push(action);

		this.currentStep.userActions.sort((a, b) => {
			if (a.immediateExecution && !b.immediateExecution) {
				return -1;
			}
			if (!a.immediateExecution && b.immediateExecution) {
				return 1;
			}
			return 0;
		}); //make sure that immediate actions are shown first, in order!
		//context should also make sure to execute in this order
	}

	public pendingUserActions(): UserAction[] {
		return this.currentStep.userActions;
	}

	public cancelPendingUserAction(userAction: UserAction) {
		const index = this.currentStep.userActions.indexOf(userAction);
		if (index > -1) {
			this.currentStep.userActions.splice(index, 1);
		}
	}

	public pendingProtocolActions(): ProtocolAction[] {
		return this.currentStep.protocolActions;
	}

	//Executes the pending actions. UserActions are always first, then protocol actions
	public executeStep() {
		const newActions = this.context.executeActions(
			this.currentStep.protocolActions,
			this.currentStep.userActions
		); //update the context state
		const stepHash = calculateStepHash(
			this.currentStep,
			this.context.getOverlaySettings().fullyConnected,
			this.context.getOverlaySettings().gossipEnabled
		);

		//because we want to be able to replay predefined scenarios,
		//only when the current step has not been modified
		if (
			this.currentStep.nextStep !== null &&
			this.currentStep.nextStep.previousStepHash === stepHash
		) {
			this.currentStep.nextStep.previousEvents = this.context.drainEvents(); //if the step was loaded from JSON, there are no events yet
			this.currentStep = this.currentStep.nextStep; //advance to the next step
			return; //context is deterministic, and if we are playing a scenario, we can reuse the next step, if there is one
		}

		const nextStep: SimulationStep = {
			userActions: [],
			protocolActions: newActions,
			previousEvents: this.context.drainEvents(),
			nextStep: null,
			previousStep: this.currentStep,
			previousStepHash: stepHash
		};

		this.currentStep.nextStep = nextStep;
		this.currentStep = nextStep;
	}

	public hasNextStep() {
		return (
			this.currentStep.nextStep !== null ||
			this.currentStep.userActions.length > 0 ||
			this.currentStep.protocolActions.length > 0
		);
	}

	hasPreviousStep() {
		return this.currentStep.previousStep !== null;
	}

	goBackOneStep(): void {
		if (this.currentStep.previousStep !== null) {
			this.currentStep = this.currentStep.previousStep;
			this.replayState();
		}
	}

	//event sourcing the state
	private replayState() {
		this.context.reset();
		let stepIterator = this.initialStep;
		while (stepIterator !== this.currentStep) {
			this.context.executeActions(
				stepIterator.protocolActions,
				stepIterator.userActions
			);
			this.context.drainEvents();
			//we assume the context is deterministic and we don't need to store the generated actions and events

			if (stepIterator.nextStep === null) {
				break; //should not happen...
			}

			stepIterator = stepIterator.nextStep;
		}
	}

	goToFirstStep(): void {
		this.currentStep = this.initialStep;
		this.context.reset();
		this.context.drainEvents();
	}

	getInitialStep(): SimulationStep {
		return this.initialStep;
	}
}

export function calculateStepHash(
	step: SimulationStep,
	isOverlayFullyConnected: boolean,
	isOverlayGossipEnabled: boolean
): string {
	return murmurhash
		.v3(
			step.userActions
				.map((a) => JSON.stringify(a.toJSON()))
				.join('|')
				.concat(
					step.protocolActions.map((a) => JSON.stringify(a.toJSON())).join('|')
				)
				.concat(isOverlayFullyConnected ? '1' : '0')
				.concat(isOverlayGossipEnabled ? '1' : '0'),
			1
		)
		.toString();
}
