import { Context } from './Context';
import { ProtocolAction } from './ProtocolAction';

//An action initiated by the user. For example 'vote' in the context of federated voting.
export abstract class UserAction {
	public readonly type = 'UserAction';
	abstract readonly publicKey: string;
	abstract readonly subType: string;
	//immediate execution for actions that for example change the (trust) network structure or the overlay
	abstract readonly immediateExecution: boolean;
	abstract execute(context: Context): ProtocolAction[];
	abstract toString(): string;
	abstract toJSON(): object;
	// Note: fromJSON is static, so it's implemented in each subclass
}
