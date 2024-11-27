import { FederatedVotingProtocolState, QuorumSet } from "scp-simulation";
import {
  Edge,
  NetworkTransitiveQuorumSetFinder,
  StronglyConnectedComponentsFinder,
  TrustGraph,
  Vertex,
} from "shared";

export class TrustGraphBuilder {
  static buildTrustGraph(states: FederatedVotingProtocolState[]): TrustGraph {
    const graph = new TrustGraph(
      new StronglyConnectedComponentsFinder(),
      new NetworkTransitiveQuorumSetFinder(),
    );
    const quorumSets: Map<string, QuorumSet> = new Map();

    states.forEach((state) => {
      graph.addVertex(
        new Vertex(state.node.publicKey, state.node.publicKey, 0),
      );
      quorumSets.set(state.node.publicKey, state.node.quorumSet);
    });

    graph.vertices.forEach((vertex) => {
      this.addNodeEdges(vertex, quorumSets.get(vertex.key), graph);
    });

    graph.updateStronglyConnectedComponentsAndNetworkTransitiveQuorumSet();
    return graph;
  }

  static addNodeEdges(
    parent: Vertex,
    quorumSet: QuorumSet | undefined,
    graph: TrustGraph,
  ) {
    if (!quorumSet) return;
    const trustedNodes = this.getAllNodes(quorumSet);
    trustedNodes.forEach((node) => {
      const vertex = graph.getVertex(node);
      if (vertex) graph.addEdge(new Edge(parent, vertex));
    });
  }
  static getAllNodes(quorumSet: QuorumSet): string[] {
    let nodes: string[] = [];
    quorumSet.validators.forEach((validator) => {
      nodes.push(validator);
    });
    quorumSet.innerQuorumSets.forEach((innerQuorumSet) => {
      nodes = nodes.concat(this.getAllNodes(innerQuorumSet));
    });
    return nodes;
  }
}
