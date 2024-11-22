import { UserAction } from '../../../core/UserAction';
import { Statement } from '../../../federated-voting-protocol';

export class Vote extends UserAction {
	constructor(
		public readonly publicKey: string,
		public readonly statement: Statement
	) {
		super();
	}

	toString(): string {
		return `Vote from ${this.publicKey} on ${this.statement}`;
	}
}
