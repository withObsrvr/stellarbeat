import { PublicKey } from '..';
import { Statement } from './Statement';
import { BaseQuorumSet } from '../node/BaseQuorumSet';

//contains the statement a node voted from and if it accepted a vote.
export class Vote {
	constructor(
		public readonly statement: Statement, // I voted for statement
		public readonly accept: boolean, //If false: I voted for the statement, else: an intact node voted for the statement
		public readonly publicKey: PublicKey,
		public readonly quorumSet: BaseQuorumSet
	) {}

	toString(): string {
		if (!this.accept) return `${this.publicKey}:vote(${this.statement})`;
		else return `${this.publicKey}:vote(accept(${this.statement}))`;
	}
}
