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
		return `${this.broadcaster} ignored broadcast of "${this.payload}" to ${this.neighbor}`;
	}
}
