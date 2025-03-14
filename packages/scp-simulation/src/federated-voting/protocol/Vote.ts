import { PublicKey, QuorumSet } from '../../core';
import { Statement } from './Statement';

//contains the statement a node voted from and if it accepted a vote.
export class Vote {
	constructor(
		public readonly statement: Statement, // I voted for statement
		public readonly isVoteToAccept: boolean, //If false: I voted for the statement, else: an intact node voted for the statement
		public readonly publicKey: PublicKey,
		public readonly quorumSet: QuorumSet
	) {}

	toString(): string {
		if (!this.isVoteToAccept)
			return `${this.publicKey}:vote(${this.statement})`;
		else return `${this.publicKey}:vote(accept(${this.statement}))`;
	}

	hash(): string {
		return `${this.publicKey.toString()}${this.statement.toString()}${this.isVoteToAccept}${this.quorumSet.toJSON()}`;
	}

	toJSON(): object {
		return {
			statement: this.statement,
			isVoteToAccept: this.isVoteToAccept,
			publicKey: this.publicKey,
			quorumSet: this.quorumSet.toJSON()
		};
	}

	static fromJSON(json: any): Vote {
		return new Vote(
			json.statement,
			json.isVoteToAccept,
			json.publicKey,
			QuorumSet.fromJSON(json.quorumSet)
		);
	}
}
