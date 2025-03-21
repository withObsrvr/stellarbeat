import { Event, ProtocolAction, UserAction } from '../../core';
import {
	AddNode,
	Broadcast,
	RemoveNode,
	UpdateQuorumSet,
	VoteOnStatement
} from '../../federated-voting';
import { ForgeMessage } from '../../federated-voting';
import { ReceiveMessage } from '../../federated-voting/action/protocol/ReceiveMessage';
import { AddConnection, Gossip, RemoveConnection } from '../../overlay';
import { SimulationStep } from '../Simulation';

export interface SerializedSimulationStep {
	userActions: any[];
	protocolActions: any[];
	previousStepHash: string;
}

/**
 * Class for serializing and deserializing SimulationStep objects
 */
export class SimulationStepSerializer {
	/**
	 * Convert a SimulationStep to a JSON-serializable object
	 */
	public toJSON(step: SimulationStep): SerializedSimulationStep {
		return {
			userActions: step.userActions.map((action) => action.toJSON()),
			protocolActions: step.protocolActions.map((action) => action.toJSON()),
			previousStepHash: step.previousStepHash ?? ''
		};
	}

	/**
	 * Create a SimulationStep from a serialized object
	 * Note: This creates a partial SimulationStep with null references for nextStep and previousStep
	 * These should be linked appropriately by the Simulation class
	 */
	public fromJSON(json: SerializedSimulationStep): SimulationStep {
		const userActions = json.userActions.map((actionJson) =>
			this.deserializeUserAction(actionJson)
		);

		const protocolActions = json.protocolActions.map((actionJson) =>
			this.deserializeProtocolAction(actionJson)
		);

		return {
			userActions,
			protocolActions,
			previousEvents: [], // Events will be regenerated during execution
			nextStep: null, //after loading all steps
			previousStep: null, // after loading all steps
			previousStepHash: json.previousStepHash
		};
	}

	private deserializeUserAction(actionJson: any): UserAction {
		switch (actionJson.subType) {
			case 'AddNode':
				return AddNode.fromJSON(actionJson);
			case 'RemoveNode':
				return RemoveNode.fromJSON(actionJson);
			case 'UpdateQuorumSet':
				return UpdateQuorumSet.fromJSON(actionJson);
			case 'VoteOnStatement':
				return VoteOnStatement.fromJSON(actionJson);
			case 'ForgeMessage':
				return ForgeMessage.fromJSON(actionJson);
			case 'AddConnection':
				return AddConnection.fromJSON(actionJson);
			case 'RemoveConnection':
				return RemoveConnection.fromJSON(actionJson);
			default:
				throw new Error(`Unknown user action type: ${actionJson.subType}`);
		}
	}

	private deserializeProtocolAction(actionJson: any): ProtocolAction {
		switch (actionJson.subType) {
			case 'Broadcast':
				return Broadcast.fromJSON(actionJson);
			case 'Gossip':
				return Gossip.fromJSON(actionJson);
			case 'ReceiveMessage':
				return ReceiveMessage.fromJSON(actionJson);
			default:
				throw new Error(`Unknown protocol action type: ${actionJson.subType}`);
		}
	}
}
