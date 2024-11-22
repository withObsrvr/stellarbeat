import { Context } from 'vm';

export abstract class ProtocolAction {
	abstract execute(context: Context): ProtocolAction[];
	abstract toString(): string;
}
