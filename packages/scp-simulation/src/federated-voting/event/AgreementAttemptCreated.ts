import { PublicKey, Statement } from '../..';
import { ProtocolEvent } from '../ProtocolEvent';

export class AgreementAttemptCreated extends ProtocolEvent {
	readonly subType = 'AgreementAttemptCreated';

	//do not pass AgreementAttempt because its state could change
	constructor(
		public readonly node: PublicKey,
		public readonly statement: Statement
	) {
		super();
	}

	toString(): string {
		return `[${this.node.toString()}][${
			this.subType
		}] AgreementAttempt started on ${this.statement.toString()}`;
	}
}
