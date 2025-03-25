import { findIntersections, findSubSetsOfSize } from "./Sets";
import {
  findAllDSets,
  findMinimalQuorums,
  findQuorums,
  NodeID,
} from "./DSetAnalysis";
import { FederatedNode } from "@/store/federated-voting/FederatedNode";

type PublicKey = string;

/**
 * Holds the analysis data for a network of nodes.
 * Use `NetworkAnalysis.analyze(nodes)` to create an instance.
 */
export class NetworkAnalysis {
  /**
   * All D-Sets found in the network. (Each set is a Set of node public keys.)
   */
  public readonly dSets: Set<PublicKey>[];

  /**
   * For each node, the possible quorum slices (subsets + itself).
   * Keyed by the node's public key.
   */
  public readonly quorumSlices: Map<PublicKey, Set<PublicKey>[]>;

  /**
   * All quorums found in the network. (A quorum is a Set of node public keys.)
   */
  public readonly quorums: Set<PublicKey>[];

  /**
   * Subset of the quorums which are minimal (no proper subset is still a quorum).
   */
  public readonly minimalQuorums: Set<PublicKey>[];

  /**
   * A set of nodes that appear in at least one minimal quorum.
   */
  public readonly topTierNodes: Set<PublicKey>;

  public readonly quorumIntersections: PublicKey[][];

  public readonly hasQuorumIntersection: boolean;

  private constructor(
    dSets: Set<PublicKey>[],
    quorumSlices: Map<PublicKey, Set<PublicKey>[]>,
    quorums: Set<PublicKey>[],
    minimalQuorums: Set<PublicKey>[],
    topTierNodes: Set<PublicKey>,
    quorumIntersections: PublicKey[][],
  ) {
    this.dSets = dSets;
    this.quorumSlices = quorumSlices;
    this.quorums = quorums;
    this.minimalQuorums = minimalQuorums;
    this.topTierNodes = topTierNodes;
    this.quorumIntersections = quorumIntersections;
    this.hasQuorumIntersection = this.quorumIntersections.length > 0;
  }

  /**
   * Analyze an array of Nodes to produce a NetworkAnalysis snapshot.
   */
  public static analyze(nodes: FederatedNode[]): NetworkAnalysis {
    const quorumSlices = new Map<PublicKey, Set<PublicKey>[]>(
      nodes.map((node) => [
        node.publicKey, //always include self
        Array.from(
          findSubSetsOfSize(
            new Set(node.trustedNodes),
            node.trustThreshold,
          ).map((subset) => subset.add(node.publicKey)),
        ),
      ]),
    );

    const dSets = findAllDSets({
      nodes: nodes.map((node) => node.publicKey),
      Q: quorumSlices,
    });

    const quorums = findQuorums(
      nodes.map((node) => node.publicKey),
      quorumSlices,
    );

    const minimalQuorums = findMinimalQuorums(quorums);

    const topTierNodes = new Set<PublicKey>();
    minimalQuorums.forEach((quorum) => {
      quorum.forEach((publicKey) => topTierNodes.add(publicKey));
    });

    const quorumIntersections = findIntersections(quorums);

    return new NetworkAnalysis(
      dSets,
      quorumSlices,
      quorums,
      minimalQuorums,
      topTierNodes,
      quorumIntersections,
    );
  }
}
