import {
  AddConnection,
  FederatedVotingContext,
  RemoveConnection,
  UserAction,
} from "scp-simulation";
import { FederatedNode } from "./FederatedNode";

/**
 * This class bridges the gap between the overlay and the gui.
 * It maps the overlay connection to GUI connections and applies user actions to preview changes to the overlay.
 **/
export class OverlayBridge {
  constructor(private context: FederatedVotingContext) {}

  replaceContext(context: FederatedVotingContext) {
    this.context = context;
  }
  createConnections(
    nodes: FederatedNode[],
    userActionsToSimulate: UserAction[],
  ): { publicKey: string; connections: string[] }[] {
    let connections: { publicKey: string; connections: string[] }[] = [];
    if (this.isFullyConnected) {
      connections = nodes.map((node) => {
        return {
          publicKey: node.publicKey,
          connections: nodes
            .filter((n) => n.publicKey !== node.publicKey)
            .map((n) => n.publicKey),
        };
      });
    } else {
      connections = this.context.overlayConnections;
    }

    // Apply pending user actions
    nodes.forEach((node) => {
      let connection = connections.find(
        (connection) => connection.publicKey === node.publicKey,
      );

      if (!connection) {
        connection = { publicKey: node.publicKey, connections: [] };
        connections.push(connection);
      } //make sure every node has a connection object to add to

      userActionsToSimulate.forEach((action) => {
        if (action instanceof AddConnection && action.a === node.publicKey) {
          connection.connections.push(action.b);
        }
        if (action instanceof RemoveConnection && action.a === node.publicKey) {
          connection.connections = connection.connections.filter(
            (c) => c !== action.b,
          );
        }
        if (
          action instanceof RemoveConnection &&
          action.b === connection.publicKey
        ) {
          //todo: handle bidirectional connections better
          connection.connections = connection.connections.filter(
            (c) => c !== action.a,
          );
        }
      });
    });

    return connections;
  }

  public calculateOverlayConnectionsHash(
    connections: {
      publicKey: string;
      connections: string[];
    }[],
  ): string {
    const sortedConnections = [...connections].sort((a, b) =>
      a.publicKey.localeCompare(b.publicKey),
    );
    return sortedConnections
      .map((connection) => {
        const sortedConnections = [...connection.connections].sort().join(",");
        return `${connection.publicKey}:[${sortedConnections}]`;
      })
      .join("|");
  }

  get isFullyConnected(): boolean {
    return this.context.overlayIsFullyConnected;
  }

  get isGossipEnabled(): boolean {
    return this.context.overlayIsGossipEnabled;
  }
}
