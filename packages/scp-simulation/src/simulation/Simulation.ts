import { Context } from '../core/Context';
import { ProtocolAction } from '../core/ProtocolAction';
import { UserAction } from '../core/UserAction';

interface SimulationStep {
	step: number;
	userActions: UserAction[];
	//we do not need to store ProtocolActions here because they are deterministically determined by the protocol
}

export class Simulation {
	private initializationActions: UserAction[] = []; //todo: part of step 0? Does user want this in log?
	private protocolActionQueue: ProtocolAction[] = [];
	private simulationSteps: Map<number, SimulationStep> = new Map();
	private log: string[] = [];
	private _step = 0;

	constructor(private context: Context) {}

	//some user actions that setup the simulation
	initialize(actions: UserAction[]): void {
		this.log.push('Initializing simulation');
		this.initializationActions = actions;
		actions.forEach((action) => {
			this.protocolActionQueue.push(...action.execute(this.context));
		});
	}

	private getCurrentSimulationStep(): SimulationStep {
		return this.getSimulationStep(this._step);
	}

	private getSimulationStep(stepNumber: number): SimulationStep {
		const step = this.simulationSteps.get(stepNumber);
		if (step) {
			return step;
		}

		const newStep: SimulationStep = {
			step: this._step,
			userActions: []
		};

		this.simulationSteps.set(this._step, newStep);

		return newStep;
	}

	private reInitialize(): void {
		this.log.push('Reinitializing simulation');
		this.initializationActions.forEach((action) => {
			this.protocolActionQueue.push(...action.execute(this.context));
		});
	}

	public addUserAction(action: UserAction): void {
		this.getCurrentSimulationStep().userActions.push(action);
	}

	//Executes the pending actions. ProtocolActions are always first, then UserActions
	next(): void {
		this.log.push('Executing next step');
		const step = this.getCurrentSimulationStep();
		this.executeStep(step);

		const events = this.context.drainEvents();

		events.forEach((event) => {
			this.log.push(event.toString()); //todo: rename log
		});

		this._step++;
	}

	private executeStep(step: SimulationStep) {
		const newProtocolActions: ProtocolAction[] = [];
		this.protocolActionQueue.forEach((action) => {
			newProtocolActions.push(...action.execute(this.context));
		});
		this.protocolActionQueue = [];

		step.userActions.forEach((action) => {
			newProtocolActions.push(...action.execute(this.context));
		});

		newProtocolActions.forEach((action) => {
			this.protocolActionQueue.push(action);
		});
	}

	previous(): void {
		this.log.push('Undoing last step');
		this.rollback();
		this._step--;
		for (let i = 0; i < this._step; i++) {
			const step = this.getSimulationStep(i);
			this.executeStep(step);
		}
	}

	reset(): void {
		this.log.push('Reset to initial state');
		this.rollback();
	}

	private rollback() {
		this.context.reset();
		this.reInitialize();
	}

	get step() {
		return this._step;
	}

	getPendingUserActions(): UserAction[] {
		return this.getCurrentSimulationStep().userActions;
	}

	getPendingProtocolActions(): ProtocolAction[] {
		return this.protocolActionQueue;
	}
}
