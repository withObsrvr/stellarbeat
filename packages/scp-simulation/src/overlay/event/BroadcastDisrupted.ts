import { Payload, PublicKey } from '../Overlay';
import { OverlayEvent } from './OverlayEvent';

export class BroadcastDisrupted extends OverlayEvent {
	subType = 'BroadcastDisrupted';

	constructor(
		public readonly broadcaster: PublicKey,
		public readonly neighbor: PublicKey,
		public readonly payload: Payload
	) {
		super(broadcaster);
	}

	toString(): string {
		return `${this.broadcaster} did not broadcast"${this.payload}" to ${this.neighbor}`;
	}
}
