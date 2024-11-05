import { PublicKey } from '..';
import { BaseQuorumSet } from '../node/BaseQuorumSet';
import { AgreementAttemptDTO } from './AgreementAttemptDTO';
import { StatementDTO } from './StatementDTO';

export interface FederatedVoteDTO {
	publicKey: PublicKey;
	quorumSet?: BaseQuorumSet;
	agreementAttempts: AgreementAttemptDTO[];
	consensus: StatementDTO | null;
}
