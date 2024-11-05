import { BaseQuorumSet } from '../node/BaseQuorumSet';
import { StatementDTO } from './StatementDTO';

export interface AgreementAttemptDTO {
	statement: StatementDTO;
	votesForStatement: {
		publicKey: string;
		quorumSet?: BaseQuorumSet;
	}[];
	votesToAcceptStatement: {
		publicKey: string;
		quorumSet?: BaseQuorumSet;
	}[];
	phase: 'unknown' | 'accepted' | 'confirmed';
}
