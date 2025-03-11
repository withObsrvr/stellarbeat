import { Payload, PublicKey } from '../Overlay';
import { OverlayEvent } from './OverlayEvent';

export class ReceiveMessageDisrupted extends OverlayEvent {
	subType = 'ReceiveMessageDisrupted';

	constructor(
		public readonly receiver: PublicKey,
		public readonly from: PublicKey,
		public readonly payload: Payload
	) {
		super(receiver);
	}

	toString(): string {
		return `${this.receiver} ignored message from ${this.from}: "${this.payload}"`;
	}
}
