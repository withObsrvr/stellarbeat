import { Context } from '../core/Context';
import { Event } from '../core/Event';
import { ProtocolAction } from '../core/ProtocolAction';
import { UserAction } from '../core/UserAction';

//A step in the simulation. Contains all user and protocol actions to be executed next
//and stores the state and events that got us here.
//Linked list
interface SimulationStep {
	userActions: UserAction[];
	protocolActions: ProtocolAction[];
	previousEvents: Event[]; //the events executed in the previous step. Todo: or store executed events? Improve naming?
	nextStep: SimulationStep | null;
	previousStep: SimulationStep | null;
}

//The simulation. Works on a context and manages the user and protocol actions. Provides an eventlog, and allows to replay the simulation.
export class Simulation {
	private initialStep: SimulationStep; //handy to replay the state
	private currentStep: SimulationStep;

	constructor(private context: Context) {
		this.currentStep = {
			userActions: [],
			protocolActions: [],
			previousEvents: [],
			nextStep: null,
			previousStep: null
		};
		this.initialStep = this.currentStep;
	}

	//todo: look into performance
	getFullEventLog(): Event[] {
		const events: Event[] = [];
		let stepIterator: SimulationStep | null = this.initialStep;
		while (stepIterator !== null) {
			events.push(...stepIterator.previousEvents);
			stepIterator = stepIterator.nextStep;
		}
		return events;
	}

	public addUserAction(action: UserAction): void {
		this.currentStep.userActions.push(action);
	}

	public pendingUserActions(): UserAction[] {
		return this.currentStep.userActions;
	}

	public pendingProtocolActions(): ProtocolAction[] {
		return this.currentStep.protocolActions;
	}

	//Executes the pending actions. ProtocolActions are always first, then UserActions
	public executeStep() {
		const nextStep: SimulationStep = {
			userActions: [],
			protocolActions: [],
			previousEvents: [],
			nextStep: null,
			previousStep: this.currentStep
		};

		const newProtocolActions: ProtocolAction[] = [];
		this.currentStep.protocolActions.forEach((action) => {
			newProtocolActions.push(...action.execute(this.context));
		});

		this.currentStep.userActions.forEach((action) => {
			newProtocolActions.push(...action.execute(this.context));
		});

		nextStep.protocolActions = newProtocolActions;

		this.currentStep.nextStep = nextStep;
		this.currentStep = nextStep;
		this.currentStep.previousEvents = this.context.drainEvents();
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

	previous(): void {
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
			stepIterator.protocolActions.forEach((action) => {
				action.execute(this.context);
			});
			stepIterator.userActions.forEach((action) => {
				action.execute(this.context);
			});

			if (stepIterator.nextStep === null) {
				break;
			}

			stepIterator = stepIterator.nextStep;
		}
	}

	goToFirstStep(): void {
		this.currentStep = this.initialStep;
		this.context.reset();
	}
}
