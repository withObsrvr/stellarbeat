import {
  AddNode,
  FederatedVotingContext,
  FederatedVotingProtocolState,
  ForgeMessage,
  ProtocolAction,
  RemoveNode,
  UpdateQuorumSet,
  UserAction,
} from "scp-simulation";
import { FederatedNode } from "./FederatedNode";

/**
 * This class bridges the gap between the protocol state and the gui.
 * It converts the protocol state to FederatedNodes that encapsulate the information needed for the gui.
 * And it takes into account possible user actions that are not yet reflected in the protocol state to enable a 'preview' functionality in the GUI.
 * It also calculates the network trust structure hash that is used to identify changes in the network trust structure.
 */
export class FederatedVotingContextBridge {
  constructor(private context: FederatedVotingContext) {}

  public replaceContext(context: FederatedVotingContext) {
    this.context = context;
  }

  private getProtocolStates(): FederatedVotingProtocolState[] {
    return this.context.getState().protocolStates;
  }

  public calculateNetworkTrustStructureHash(nodes: FederatedNode[]): string {
    const sortedNodes = nodes.sort((a, b) =>
      a.publicKey.localeCompare(b.publicKey),
    );
    return sortedNodes
      .map((node) => {
        const trustedNodesSorted = [...node.trustedNodes].sort().join(",");
        return `${node.publicKey}:${node.trustThreshold}:[${trustedNodesSorted}]`;
      })
      .join("|");
  }

  public getFederatedNodes(
    userActionsToPreview: UserAction[],
  ): FederatedNode[] {
    let nodes: FederatedNode[] = this.getProtocolStates().map((state) =>
      this.mapStateToFederatedNode(state as FederatedVotingProtocolState),
    );

    nodes = nodes.concat(
      userActionsToPreview
        .filter((action) => action instanceof AddNode)
        .map((action) => {
          return {
            publicKey: action.publicKey,
            trustedNodes: action.quorumSet.validators.slice(),
            trustThreshold: action.quorumSet.threshold,
            voted: null,
            accepted: null,
            confirmed: null,
            phase: "unknown",
            processedVotes: [],
          };
        }),
    );

    const nodesToRemove = userActionsToPreview
      .filter((action) => action instanceof RemoveNode)
      .map((action) => action.publicKey);

    nodes = nodes.filter((node) => !nodesToRemove.includes(node.publicKey));

    userActionsToPreview
      .filter((action) => action instanceof UpdateQuorumSet)
      .forEach((action) => {
        const node = nodes.find((node) => node.publicKey === action.publicKey);
        if (!node) {
          return;
        }
        node.trustedNodes = action.quorumSet.validators.slice();
        node.trustThreshold = action.quorumSet.threshold;
      });

    return nodes;
  }

  public getFederatedNode(publickey: string): FederatedNode | null {
    const state = this.getProtocolStates().find(
      (state) => state.node.publicKey === publickey,
    );
    if (!state) {
      return null;
    }
    return this.mapStateToFederatedNode(state);
  }

  private mapStateToFederatedNode(
    state: FederatedVotingProtocolState,
  ): FederatedNode {
    return {
      publicKey: state.node.publicKey,
      trustedNodes: state.node.quorumSet.validators.slice(),
      trustThreshold: state.node.quorumSet.threshold,
      voted: state.voted ? state.voted.toString() : null,
      accepted: state.accepted ? state.accepted.toString() : null,
      confirmed: state.confirmed ? state.confirmed.toString() : null,
      phase: state.phase,
      processedVotes: state.processedVotes,
    };
  }

  public getDisruptingNodes(
    userActionsToSimulate: UserAction[],
    protocolActionsToSimulate: ProtocolAction[],
  ): {
    safetyDisruptingNodes: string[];
    livenessDisruptingNodes: string[];
  } {
    const safetyDisruptingNodes = Array.from(
      this.context.getState().safetyDisruptingNodes,
    );
    const livenessDisruptingNodes = Array.from(
      this.context.getState().livenessDisruptingNodes,
    );

    protocolActionsToSimulate.forEach((action) => {
      if (action.isDisrupted) {
        livenessDisruptingNodes.push(action.publicKey);
      }
    });
    userActionsToSimulate.forEach((action) => {
      if (action instanceof ForgeMessage) {
        safetyDisruptingNodes.push(action.message.sender);
      }
    });

    return {
      safetyDisruptingNodes,
      livenessDisruptingNodes,
    };
  }

  public containsNode(publicKey: string): boolean {
    return this.getProtocolStates().some(
      (state) => state.node.publicKey === publicKey,
    );
  }
}
