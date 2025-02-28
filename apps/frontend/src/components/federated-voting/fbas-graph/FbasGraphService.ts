import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  Simulation,
} from "d3-force";
import { Node } from "./fbas-graph-node.vue";
import { Link } from "./fbas-graph-link.vue";
import { FederatedNode } from "@/store/useFederatedVotingStore";

export class FbasGraphService {
  private simulation: Simulation<Node, undefined> | null = null;

  createLinksFromNodes(nodes: Node[]): Link[] {
    const constructedLinks: Link[] = [];

    nodes.forEach((node) => {
      node.validators?.forEach((validator) => {
        constructedLinks.push({
          source: node.id,
          target: validator,
          selfLoop: validator === node.id,
          hovered: false,
        });
      });
    });

    // Identify bidirectional links
    const linkMap = new Map<string, Link>();

    const linkKey = (link: Link) => {
      const sourceId =
        typeof link.source === "string"
          ? link.source
          : typeof link.source === "number"
            ? link.source.toString()
            : link.source.id;
      const targetId =
        typeof link.target === "string"
          ? link.target
          : typeof link.target === "number"
            ? link.target.toString()
            : link.target.id;
      return `${sourceId}-${targetId}`;
    };

    constructedLinks.forEach((link) => linkMap.set(linkKey(link), link));

    constructedLinks.forEach((link) => {
      const reverseKey = linkKey({
        source: link.target,
        target: link.source,
      } as Link);
      if (linkMap.has(reverseKey)) {
        if (link.source !== link.target) {
          link.bidirectional = true;
          linkMap.get(reverseKey)!.bidirectional = true;
        }
      } else {
        link.bidirectional = false;
      }
    });

    return constructedLinks;
  }

  createNodes(nodes: FederatedNode[], existingNodes: Node[] = []): Node[] {
    const nodePositions = new Map<
      string,
      { x: number; y: number; vx?: number; vy?: number }
    >();
    existingNodes.forEach((node) => {
      if (node.x !== undefined && node.y !== undefined) {
        nodePositions.set(node.id, {
          x: node.x,
          y: node.y,
          vx: node.vx,
          vy: node.vy,
        });
      }
    });

    // Create new nodes
    return nodes.map((node) => {
      const position = nodePositions.get(node.publicKey);

      return {
        id: node.publicKey,
        validators: node.trustedNodes,
        threshold: node.trustThreshold,
        vote: node.voted,
        accept: node.accepted,
        confirm: node.confirmed,
        x: position ? position.x : 0,
        y: position ? position.y : 0,
        vx: position?.vx || 0,
        vy: position?.vy || 0,
        events: [],
      };
    });
  }

  updateNodeStates(nodes: Node[], sourceNodes: FederatedNode[]): void {
    nodes.forEach((node) => {
      const sourceNode = sourceNodes.find(
        (sNode) => sNode.publicKey === node.id,
      );
      if (sourceNode) {
        node.vote = sourceNode.voted;
        node.accept = sourceNode.accepted;
        node.confirm = sourceNode.confirmed;
      }
    });
  }

  updateForceSimulation(
    nodes: Node[],
    links: Link[],
    width: number,
    height: number,
    topTierNodeIds: string[],
  ): Simulation<Node, undefined> {
    if (this.simulation !== null) {
      this.simulation.nodes(nodes);
      this.simulation.force(
        "link",
        forceLink<Node, Link>(links)
          .id((node: Node) => node.id)
          .distance(150),
      );

      this.simulation.force("center", forceCenter(width / 2, height / 2));
      this.simulation.force(
        "topTierX",
        forceX<Node>(width / 2).strength((node) =>
          topTierNodeIds.includes(node.id) ? 0.2 : 0,
        ),
      );

      this.simulation.force(
        "topTierY",
        forceY<Node>(height / 2).strength((node) =>
          topTierNodeIds.includes(node.id) ? 0.2 : 0,
        ),
      );

      this.simulation.alpha(0.3).restart();
    } else {
      this.simulation = forceSimulation<Node>(nodes)
        .force(
          "link",
          forceLink<Node, Link>(links)
            .id((node: Node) => node.id)
            .distance(150),
        )
        .force("charge", forceManyBody().strength(-1000))
        .force("center", forceCenter(width / 2, height / 2))
        .force(
          "topTierX",
          forceX<Node>(width / 2).strength((node) =>
            topTierNodeIds.includes(node.id) ? 0.2 : 0,
          ),
        )
        .force(
          "topTierY",
          forceY<Node>(height / 2).strength((node) =>
            topTierNodeIds.includes(node.id) ? 0.2 : 0,
          ),
        );
    }

    return this.simulation;
  }
}

export default new FbasGraphService();
