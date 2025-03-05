import { Context, ProtocolAction } from '../../core';
import { Payload } from '../Overlay';

type PublicKey = string;

export class Gossip extends ProtocolAction {
	readonly subType = 'GossipMessage';
	readonly publicKey: PublicKey;

	constructor(
		public readonly sender: PublicKey,
		public readonly payload: Payload
	) {
		super();
		this.publicKey = sender;
	}

	execute(context: Context): ProtocolAction[] {
		return context.gossipPayload(this.sender, this.payload);
	}

	toString(): string {
		return `${this.sender} gossips message: "${this.payload}"`;
	}
}
