import { Context } from './Context';
import { ProtocolAction } from './ProtocolAction';

//An action initiated by the user. For example 'vote' in the context of federated voting.
export abstract class UserAction {
	abstract execute(context: Context): ProtocolAction[];
	abstract toString(): string;
}
