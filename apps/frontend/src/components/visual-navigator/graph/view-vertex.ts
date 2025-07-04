import { TrustGraph, Vertex } from "shared";

export default class ViewVertex {
  key: string;
  label: string;
  x = 0;
  y = 0;
  isPartOfTransitiveQuorumSet: boolean;
  isTrustingSelectedVertex = false;
  isTrustedBySelectedVertex = false;
  selected = false;
  isFailing = false;
  // Trust properties
  trustCentralityScore = 0;
  pageRankScore = 0;
  trustRank = 0;
  organizationalDiversity = 0;

  constructor(
    key: string,
    label: string,
    isPartOfTransitiveQuorumSet: boolean,
  ) {
    this.key = key;
    this.label = label;
    this.isPartOfTransitiveQuorumSet = isPartOfTransitiveQuorumSet;
  }

  static fromVertex(
    vertex: Vertex,
    trustGraph: TrustGraph,
    failingNodes: Set<string>,
  ) {
    const viewVertex = new ViewVertex(
      vertex.key,
      vertex.label,
      trustGraph.isVertexPartOfNetworkTransitiveQuorumSet(vertex.key),
    );
    viewVertex.isFailing = failingNodes.has(vertex.key);

    return viewVertex;
  }

  static fromOrganization(
    vertex: Vertex,
    trustGraph: TrustGraph,
    failingOrganizations: Set<string>,
  ) {
    const viewVertex = new ViewVertex(
      vertex.key,
      vertex.label,
      trustGraph.isVertexPartOfNetworkTransitiveQuorumSet(vertex.key),
    );
    viewVertex.isFailing = failingOrganizations.has(vertex.key);

    return viewVertex;
  }
}
