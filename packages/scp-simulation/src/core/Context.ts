import { ProtocolAction } from './ProtocolAction';
import { UserAction } from './UserAction';
import { EventCollector } from './EventCollector';

//a context for the simulation. E.g. federated voting
export interface Context extends EventCollector {
	executeUserAction(action: UserAction): ProtocolAction[];
	executeProtocolAction(action: ProtocolAction): ProtocolAction[];
}
