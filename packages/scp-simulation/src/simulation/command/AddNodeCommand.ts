import { PublicKey } from '../..';
import { BaseQuorumSet } from '../../node/BaseQuorumSet';
import { Command } from '../Command';
import { Simulation } from '../Simulation';

export class AddNodeCommand implements Command {
	command = 'add-node';

	constructor(private publicKey: PublicKey, private quorumSet: BaseQuorumSet) {}

	execute(simulation: Simulation): void {
		simulation.addNode(this.publicKey, this.quorumSet);
	}

	toString(): string {
		return `Add node ${this.publicKey}`;
	}
}
