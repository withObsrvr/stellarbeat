import { PublicKey } from '../..';
import { Command } from '../Command';
import { Simulation } from '../Simulation';

export class AddConnectionCommand implements Command {
	command = 'add-connection';

	constructor(private nodeA: PublicKey, private nodeB: PublicKey) {}

	execute(simulation: Simulation): void {
		simulation.addConnection(this.nodeA, this.nodeB);
	}

	toString(): string {
		return `Add connection between ${this.nodeA} and ${this.nodeB}`;
	}
}
