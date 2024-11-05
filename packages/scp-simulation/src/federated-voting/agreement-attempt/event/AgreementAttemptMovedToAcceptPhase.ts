import { PublicKey, Statement } from '../../..';
import { ProtocolEvent } from '../../ProtocolEvent';

import { AgreementAttemptPhase } from '../AgreementAttempt';

export class AgreementAttemptMovedToAcceptPhase extends ProtocolEvent {
	readonly subType = 'AgreementAttemptMovedToAcceptPhase';
	constructor(
		public readonly publicKey: PublicKey,
		public readonly agreementAttemptPhase: AgreementAttemptPhase,
		public readonly statement: Statement
	) {
		super();
	}

	toString(): string {
		return `[${this.publicKey}][${
			this.subType
		}] Agreement attempt on ${this.statement.toString()} moved to phase ${
			this.agreementAttemptPhase
		}`;
	}
}
