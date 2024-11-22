import { Context } from '../core/Context';
import { ProtocolAction } from '../core/ProtocolAction';
import { UserAction } from '../core/UserAction';

export class Simulation {
	private protocolActionQueue: Set<ProtocolAction> = new Set();
	private userActionQueue: Set<UserAction> = new Set();
	private log: string[] = [];
	private _step = 0;

	constructor(private context: Context) {}

	//some user actions that setup the simulation
	initialize(actions: UserAction[]): void {
		this.log.push('Initializing simulation');
		actions.forEach((action) => {
			this.context.executeUserAction(action);
		});
	}

	public addUserAction(action: UserAction): void {
		this.userActionQueue.add(action);
	}

	//Executes the pending actions. ProtocolActions are always first, then UserActions
	next(): void {
		this.log.push('Executing next step');
		const newProtocolActions: ProtocolAction[] = [];
		this.protocolActionQueue.forEach((action) => {
			newProtocolActions.push(...this.context.executeProtocolAction(action));
		});
		this.protocolActionQueue.clear();

		this.userActionQueue.forEach((action) => {
			newProtocolActions.push(...this.context.executeUserAction(action));
		});
		this.userActionQueue.clear();

		newProtocolActions.forEach((action) => {
			this.protocolActionQueue.add(action);
		});

		const events = this.context.drainEvents();
		events.forEach((event) => {
			this.log.push(event.toString()); //todo: rename log
		});

		this._step++;
	}

	previous(): void {
		this.log.push('Undoing last step');
	}

	get step() {
		return this._step;
	}

	getPendingUserActions(): UserAction[] {
		return Array.from(this.userActionQueue);
	}

	getPendingProtocolActions(): ProtocolAction[] {
		return Array.from(this.protocolActionQueue);
	}
}
