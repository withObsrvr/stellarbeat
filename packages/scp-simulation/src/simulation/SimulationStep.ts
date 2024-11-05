import { EventCollector } from '../core/EventCollector';
import { Command } from './Command';

import { Simulation } from './Simulation';

export class SimulationStep extends EventCollector {
	private commands: Command[] = [];

	constructor(public readonly id: number) {
		super();
	}

	addCommand(command: Command): void {
		console.log(
			`Adding command: ${command.toString()} to simulation step ${this.id}`
		);
		this.commands.push(command);
	}

	execute(simulation: Simulation): void {
		console.log(`\n--- Executing step ${this.id} ---\n`);
		this.commands.forEach((command) => {
			console.log(`Executing command: ${command.toString()}`);
			command.execute(simulation);
		});
		simulation.deliverMessagesInOutbox();

		this.registerEvents(simulation.drainEvents());
	}

	hasCommands(): boolean {
		return this.commands.length > 0;
	}

	getCommandInfo(): string {
		return JSON.stringify(
			this.commands.map((command) => command.toString()),
			null,
			2
		);
	}
}
