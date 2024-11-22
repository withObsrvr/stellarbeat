import { Context } from '../core/Context';
import { ProtocolAction } from '../core/ProtocolAction';
import { UserAction } from '../core/UserAction';

export class Simulation {
	private protocolActionQueue: Set<ProtocolAction> = new Set();
	private userActionQueue: Set<UserAction> = new Set();

	constructor(private context: Context) {}

	public addUserAction(action: UserAction): void {
		this.userActionQueue.add(action);
	}

	//Executes the pending actions. ProtocolActions are always first, then UserActions
	flush(): void {
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
	}
}
