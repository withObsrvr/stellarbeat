import { PublicKey } from '.';
import { Message } from '../federated-voting';
import { Payload } from '../overlay/Overlay';
import { EventCollector } from './EventCollector';
import { Node } from './Node';
import { ProtocolAction } from './ProtocolAction';
import { QuorumSet } from './QuorumSet';
import { UserAction } from './UserAction';

// The context runs the protocol and provides a playground.
// For example the federated voting protocol allows a user to vote on a single statement,
// Acts as a mediator between the protocol and the overlay
export interface Context extends EventCollector {
	loadInitialNodes(nodes: Node[]): void;
	executeActions(
		protocolActions: ProtocolAction[],
		userActions: UserAction[]
	): ProtocolAction[];
	reset(): void;

	//message actions
	receiveMessage(message: Message): ProtocolAction[];
	broadcastPayload(broadcaster: PublicKey, payload: Payload): ProtocolAction[];
	gossipPayload(gossiper: PublicKey, payload: Payload): ProtocolAction[];

	//network structure actions
	addNode(node: Node): ProtocolAction[];
	addConnection(a: PublicKey, b: PublicKey): ProtocolAction[];
	removeNode(publicKey: string): ProtocolAction[];
	removeConnection(a: PublicKey, b: PublicKey): ProtocolAction[];
	updateQuorumSet(publicKey: string, quorumSet: QuorumSet): ProtocolAction[];
}
