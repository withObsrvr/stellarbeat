import { EventCollector } from './EventCollector';
import { Node } from './Node';
import { ProtocolAction } from './ProtocolAction';
import { UserAction } from './UserAction';

// The context runs the protocol and provides a playground.
// For example the federated voting protocol allows a user to vote on a single statement,
// actually broadcasts the messages, holds the state for every node and so on.
export interface Context extends EventCollector {
	loadInitialNodes(nodes: Node[]): void;
	executeActions(
		protocolActions: ProtocolAction[],
		userActions: UserAction[]
	): ProtocolAction[];
	reset(): void;
}
