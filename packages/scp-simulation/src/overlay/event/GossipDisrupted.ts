import { Payload, PublicKey } from '../Overlay';
import { OverlayEvent } from './OverlayEvent';

export class GossipDisrupted extends OverlayEvent {
	subType = 'GossipDisrupted';

	constructor(
		public readonly gossiper: PublicKey,
		public readonly neighbor: PublicKey,
		public readonly payload: Payload
	) {
		super(gossiper);
	}

	toString(): string {
		return `${this.gossiper} ignored gossip of "${this.payload}" to ${this.neighbor}`;
	}
}
