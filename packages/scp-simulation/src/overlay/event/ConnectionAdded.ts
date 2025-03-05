import { PublicKey } from '../Overlay';
import { OverlayEvent } from './OverlayEvent';

export class ConnectionAdded extends OverlayEvent {
	subType = 'ConnectionAdded';

	constructor(
		public readonly a: PublicKey,
		public readonly b: PublicKey
	) {
		super(a);
	}

	toString(): string {
		return `Connection between ${this.a} and ${this.b} was added`;
	}
}
