import { EventCollector } from './EventCollector';

//a context for the simulation. E.g. federated voting
export interface Context extends EventCollector {
	reset(): void;
}
