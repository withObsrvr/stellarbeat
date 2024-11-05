import { PublicKey, Statement } from '../..';
import { Command } from '../Command';
import { Simulation } from '../Simulation';

export class VoteCommand implements Command {
	command = 'vote';

	constructor(private publicKey: PublicKey, private statement: Statement) {}
	execute(simulation: Simulation): void {
		simulation.vote(this.publicKey, this.statement);
	}

	toString(): string {
		return `Vote from ${this.publicKey} on ${this.statement}`;
	}
}
