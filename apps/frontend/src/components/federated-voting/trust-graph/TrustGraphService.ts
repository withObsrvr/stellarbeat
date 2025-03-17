import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  Simulation,
} from "d3-force";
import { Node } from "./trust-graph-node.vue";
import { Link } from "./trust-graph-link.vue";
import { FederatedNode } from "@/store/useFederatedVotingStore";
import { ProtocolEvent } from "scp-simulation";

export class TrustGraphService {
  private simulation: Simulation<Node, undefined> | null = null;

  createLinksFromNodes(nodes: Node[]): Link[] {
    const knownNodes: Set<string> = new Set();
    nodes.forEach((node) => knownNodes.add(node.id));

    const constructedLinks: Link[] = [];

    nodes.forEach((node) => {
      node.validators?.forEach((validator) => {
        if (knownNodes.has(validator)) {
          constructedLinks.push({
            source: node.id,
            target: validator,
            selfLoop: validator === node.id,
            hovered: false,
          });
        }
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
    existingNodes.forEach((node) => {
      const sourceNode = nodes.find((sNode) => sNode.publicKey === node.id);
      if (sourceNode) {
        node.validators = sourceNode.trustedNodes;
        node.threshold = sourceNode.trustThreshold;
        node.vote = sourceNode.voted;
        node.accept = sourceNode.accepted;
        node.confirm = sourceNode.confirmed;
      }
    });

    const newNodes = nodes
      .filter((node) => !existingNodes.find((n) => n.id === node.publicKey))
      .map((node) => {
        return {
          id: node.publicKey,
          validators: node.trustedNodes,
          threshold: node.trustThreshold,
          vote: node.voted,
          accept: node.accepted,
          confirm: node.confirmed,
          x: 0,
          y: 0,
          events: [],
        };
      });

    return existingNodes
      .concat(newNodes)
      .filter((node) => nodes.find((n) => n.publicKey === node.id));
  }

  updateNodeStates(
    nodes: Node[],
    sourceNodes: FederatedNode[],
    selectedNode: FederatedNode | null,
    events: ProtocolEvent[],
  ): void {
    // No selected node - show the system view, meaning the actual states of the nodes
    if (!selectedNode) {
      nodes.forEach((node) => {
        const sourceNode = sourceNodes.find(
          (sNode) => sNode.publicKey === node.id,
        );
        if (sourceNode) {
          node.vote = sourceNode.voted;
          node.accept = sourceNode.accepted;
          node.confirm = sourceNode.confirmed;
          node.events = events.filter(
            (event) =>
              event instanceof ProtocolEvent && event.publicKey === node.id,
          );
        }
      });
      return;
    }

    // Selected node - show the view from the perspective of the selected node based on its processed messages
    nodes.forEach((node) => {
      if (node.id === selectedNode.publicKey) {
        // Selected node shows its own state
        node.vote = selectedNode.voted;
        node.accept = selectedNode.accepted;
        node.confirm = selectedNode.confirmed;
        node.events = events.filter(
          (event) =>
            event instanceof ProtocolEvent && event.publicKey === node.id,
        );
      } else {
        // For other nodes, show what the selected node knows about them
        const processedVotes = selectedNode.processedVotes.filter(
          (vote) => vote.publicKey === node.id,
        );

        // Reset states first
        node.vote = null;
        node.accept = null;
        node.confirm = null;

        // Update based on processed votes
        if (processedVotes.length > 0) {
          // Find regular votes (not accept votes)
          const regularVotes = processedVotes.filter(
            (vote) => !vote.isVoteToAccept,
          );
          if (regularVotes.length > 0) {
            node.vote = regularVotes[0].statement.toString();
          }

          // Find accept votes
          const acceptVotes = processedVotes.filter(
            (vote) => vote.isVoteToAccept,
          );
          if (acceptVotes.length > 0) {
            node.accept = acceptVotes[0].statement.toString();
          }

          // A node never knows if another node has confirmed a value
          // So we leave node.confirm as null for other nodes
        }
      }
    });
  }

  updateRepellingForce(repellingForce: number): void {
    if (this.simulation) {
      this.simulation.force(
        "charge",
        forceManyBody().strength(-repellingForce),
      );
      this.simulation.alpha(0.3).restart();
    }
  }

  updateForceSimulation(
    nodes: Node[],
    links: Link[],
    width: number,
    height: number,
    topTierNodeIds: string[],
    repellingForce: number = 1500,
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
        .force("charge", forceManyBody().strength(-repellingForce))
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

export default new TrustGraphService();
