import { Edge, TrustGraph } from "shared";

export default class ViewEdge {
  key: string;
  source: Record<string, unknown> | string; //key is replaced by object in d3
  target: Record<string, unknown> | string; //key is replaced by object in d3
  parent: string;
  child: string;
  isPartOfStronglyConnectedComponent = false;
  isPartOfTransitiveQuorumSet = false;
  highlightAsTrusting = false;
  highlightAsTrusted = false;
  isFailing = false;
  x?: number;
  y?: number;

  constructor(source: string, target: string) {
    this.source = source;
    this.target = target;
    this.parent = source;
    this.child = target;
    this.key = source + ":" + target;
  }

  protected static fromEdge(edge: Edge, trustGraph: TrustGraph) {
    const viewEdge = new ViewEdge(edge.parent.key, edge.child.key);
    viewEdge.isPartOfStronglyConnectedComponent =
      trustGraph.isEdgePartOfStronglyConnectedComponent(edge);
    viewEdge.isPartOfTransitiveQuorumSet =
      trustGraph.isEdgePartOfNetworkTransitiveQuorumSet(edge);

    return viewEdge;
  }

  static fromNodeEdge(
    edge: Edge,
    trustGraph: TrustGraph,
    failingNodes: Set<string>,
  ) {
    const viewEdge = ViewEdge.fromEdge(edge, trustGraph);
    if (failingNodes.has(edge.parent.key) || failingNodes.has(edge.child.key))
      viewEdge.isFailing = true;

    return viewEdge;
  }

  static fromOrganizationEdge(
    edge: Edge,
    trustGraph: TrustGraph,
    failingOrganizations: Set<string>,
  ) {
    const viewEdge = ViewEdge.fromEdge(edge, trustGraph);

    if (
      failingOrganizations.has(edge.parent.key) ||
      failingOrganizations.has(edge.child.key)
    )
      viewEdge.isFailing = true;

    return viewEdge;
  }
}
