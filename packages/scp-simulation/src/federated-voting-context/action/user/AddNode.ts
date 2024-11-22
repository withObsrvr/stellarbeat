import { QuorumSet } from '../../../core/QuorumSet';
import { UserAction } from '../../../core/UserAction';

export class AddNode extends UserAction {
	constructor(
		public readonly publicKey: string,
		public readonly quorumSet: QuorumSet
	) {
		super();
	}

	toString(): string {
		return `Add node ${this.publicKey}`;
	}
}
