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
    this.updateConnections(links);
  }

  getNodeById(id: string): NodeDatum | null {
    const node = this.nodesMap.get(id);
    if (!node) return null;
    return node;
  }

  isLinkSelected(link: LinkDatum, selectedNode: NodeDatum) {
    return link.source === selectedNode;
  }

  updateConnections(links: LinkDatum[]) {
    this.links = links;
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
