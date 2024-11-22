import { Context } from './Context';
import { ProtocolAction } from './ProtocolAction';

export abstract class UserAction {
	abstract execute(context: Context): ProtocolAction[];
	abstract toString(): string;
}
