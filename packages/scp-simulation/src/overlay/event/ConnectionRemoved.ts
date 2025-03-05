import { PublicKey } from '../Overlay';
import { OverlayEvent } from './OverlayEvent';

export class ConnectionRemoved extends OverlayEvent {
	subType = 'ConnectionRemoved';

	constructor(
		public readonly a: PublicKey,
		public readonly b: PublicKey
	) {
		super(a);
	}

	toString(): string {
		return `Connection between ${this.a} and ${this.b} was removed`;
	}
}
