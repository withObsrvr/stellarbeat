import { FederatedNode } from "@/store/useFederatedVotingStore";
import { type SimulationLinkDatum, type SimulationNodeDatum } from "d3-force";

export interface NodeDatum extends SimulationNodeDatum {
  id: string;
  name: string;
}

export interface LinkDatum extends SimulationLinkDatum<NodeDatum> {
  source: NodeDatum;
  target: NodeDatum;
}

export class GraphManager {
  private nodesMap: Map<string, NodeDatum>;
  nodes: NodeDatum[];
  links: LinkDatum[] = [];

  constructor(nodes: NodeDatum[], links: LinkDatum[]) {
    this.nodes = nodes;
    this.nodesMap = new Map(nodes.map((node) => [node.id, node]));
    this.links = links;
  }

  getNodeById(id: string): NodeDatum | null {
    const node = this.nodesMap.get(id);
    if (!node) return null;
    return node;
  }

  isLinkSelected(link: LinkDatum, selectedNode: NodeDatum) {
    return link.source === selectedNode;
  }

  updateGraph(
    nodes: FederatedNode[],
    connections: { publicKey: string; connections: string[] }[],
  ): boolean {
    const nodesChanged = this.updateNodes(nodes);
    const linksChanged = this.updateLinks(connections);

    return nodesChanged || linksChanged;
  }

  //returns true if the graph has changed
  private updateNodes(nodes: FederatedNode[]): boolean {
    let changed = false;
    //remove nodes no longer present
    const nodesLength = this.nodes.length;
    this.nodes = this.nodes.filter((node) =>
      nodes.some((n) => n.publicKey === node.id),
    );
    if (nodesLength !== this.nodes.length) changed = true;

    //add new nodes
    nodes.forEach((node) => {
      if (this.nodes.filter((n) => n.id === node.publicKey).length === 0) {
        this.nodes.push({
          id: node.publicKey,
          name: node.publicKey,
          x: this.getRandomInt(0, 1000),
          y: this.getRandomInt(0, 1000),
        });
      }
    });
    if (nodesLength !== this.nodes.length) changed = true;

    return changed;
  }

  //returns true if the graph has changed
  private updateLinks(
    connections: { publicKey: string; connections: string[] }[],
  ): boolean {
    let changed = false;

    const links = this.mapLinks(connections);

    const linksLength = this.links.length;
    //remove links no longer present
    this.links = this.links.filter((link) =>
      links.some(
        (l) =>
          (l.source.id === link.source.id && l.target.id === link.target.id) ||
          (l.source.id === link.target.id && l.target.id === link.source.id), // Bidirectional connection
      ),
    );
    if (linksLength !== this.links.length) changed = true;
    //add new links
    links.forEach((link) => {
      if (
        this.links.filter(
          (l) => l.source === link.source && l.target === link.target,
        ).length === 0
      ) {
        this.links.push(link);
      }
    });
    if (linksLength !== this.links.length) changed = true;

    return changed;
  }

  private mapLinks(
    connections: { publicKey: string; connections: string[] }[],
  ) {
    const links: LinkDatum[] = [];
    connections.forEach((node) => {
      node.connections.forEach((connection) => {
        const source = this.nodes.find((n) => n.id === node.publicKey);
        const target = this.nodes.find((n) => n.id === connection);
        if (!source || !target) return;
        if (
          links.some(
            (link) =>
              link.source.id === target.id && link.target.id === source.id,
          ) // Bidirectional connection
        ) {
          return;
        }
        links.push({
          source,
          target,
        });
      });
    });

    return links;
  }

  addLink(source: NodeDatum, target: NodeDatum) {
    if (
      this.links.filter(
        (link) => link.source === source && link.target === target,
      ).length === 0
    ) {
      this.links.push({
        source: source,
        target: target,
      });
    }
  }

  removeLink(link: LinkDatum) {
    this.links = this.links.filter((l) => l !== link);
  }

  private getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min) + min);
  }
}
