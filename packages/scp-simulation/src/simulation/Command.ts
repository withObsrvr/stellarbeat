import { Simulation } from './Simulation';

export interface Command {
	command: string;
	execute(simulation: Simulation): void;
	toString(): string;
}
