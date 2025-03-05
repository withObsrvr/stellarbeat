import { Context, ProtocolAction, PublicKey } from '../../../core';
import { Payload } from '../../../overlay/Overlay';

export class Broadcast extends ProtocolAction {
	subType = 'broadcastPayload';
	public readonly publicKey: string;
	constructor(
		public readonly broadcaster: PublicKey,
		public readonly payload: Payload
	) {
		super();
		this.publicKey = broadcaster;
	}

	execute(context: Context): ProtocolAction[] {
		return context.broadcastPayload(this.broadcaster, this.payload);
	}

	toString(): string {
		return `${this.payload.toString()}`;
	}
}
