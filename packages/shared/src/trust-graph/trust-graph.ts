import { PublicKey } from '../network';
import {
	StronglyConnectedComponent,
	StronglyConnectedComponentsFinder
} from './strongly-connected-components-finder';
import { NetworkTransitiveQuorumSetFinder } from './network-transitive-quorum-set-finder';

export type VertexKey = string;

export class Vertex {
	public readonly key: VertexKey;
	public readonly label: string;
	public readonly weight: number;

	constructor(publicKey: PublicKey, label: string, weight: number) {
		this.label = label;
		this.key = publicKey;
		this.weight = weight;
	}

	toString() {
		return `Vertex (publicKey: ${this.key}, label: ${this.label})`;
	}
}

export function isVertex(vertex: Vertex | undefined): vertex is Vertex {
	return vertex instanceof Vertex;
}

export class Edge {
	public readonly parent: Vertex;
	public readonly child: Vertex;

	constructor(parent: Vertex, child: Vertex) {
		this.parent = parent;
		this.child = child;
	}

	toString() {
		return `Edge (parent: ${this.parent.key}, child: ${this.child.key})`;
	}
}

export class TrustGraph {
	protected readonly _stronglyConnectedComponentsFinder: StronglyConnectedComponentsFinder;
	protected readonly _networkTransitiveQuorumSetFinder: NetworkTransitiveQuorumSetFinder;

	protected _vertices = new Map<PublicKey, Vertex>();
	protected _edges = new Set<Edge>();

	protected _stronglyConnectedComponents: Array<StronglyConnectedComponent> =
		[];
	protected _stronglyConnectedVertices: Map<PublicKey, number> = new Map<
		PublicKey,
		number
	>();
	protected _networkTransitiveQuorumSet: Set<PublicKey> = new Set<PublicKey>();

	protected children = new Map<PublicKey, Set<Vertex>>();
	protected parents = new Map<PublicKey, Set<Vertex>>();

	constructor(
		stronglyConnectedComponentsFinder: StronglyConnectedComponentsFinder,
		networkTransitiveQuorumSetFinder: NetworkTransitiveQuorumSetFinder
	) {
		this._stronglyConnectedComponentsFinder = stronglyConnectedComponentsFinder;
		this._networkTransitiveQuorumSetFinder = networkTransitiveQuorumSetFinder;
	}

	public updateStronglyConnectedComponentsAndNetworkTransitiveQuorumSet() {
		this._stronglyConnectedComponents =
			this._stronglyConnectedComponentsFinder.findTarjan(this);
		this._stronglyConnectedVertices = new Map<PublicKey, number>();

		for (let i = 0; i < this._stronglyConnectedComponents.length; i++) {
			this._stronglyConnectedComponents[i].forEach((publicKey) =>
				this._stronglyConnectedVertices.set(publicKey, i)
			);
		}

		this._networkTransitiveQuorumSet =
			this._networkTransitiveQuorumSetFinder.getTransitiveQuorumSet(
				this._stronglyConnectedComponents,
				this
			);
	}

	public hasNetworkTransitiveQuorumSet() {
		return this._networkTransitiveQuorumSet.size > 0;
	}

	get networkTransitiveQuorumSet() {
		return this._networkTransitiveQuorumSet;
	}

	public addVertex(vertex: Vertex) {
		this._vertices.set(vertex.key, vertex);
		this.children.set(vertex.key, new Set<Vertex>());
		this.parents.set(vertex.key, new Set<Vertex>());
	}

	public getInDegree(vertex: Vertex): number {
		if (!this.parents.has(vertex.key)) {
			throw new Error('Vertex not part of graph: ' + vertex);
		}
		return this.parents.get(vertex.key)!.size;
	}

	public getOutDegree(vertex: Vertex): number {
		if (!this.children.has(vertex.key)) {
			throw new Error('Vertex not part of graph: ' + vertex);
		}
		return this.children.get(vertex.key)!.size;
	}

	public isVertexPartOfNetworkTransitiveQuorumSet(publicKey: PublicKey) {
		return this._networkTransitiveQuorumSet.has(publicKey);
	}

	public getStronglyConnectedComponent(key: VertexKey) {
		return this._stronglyConnectedVertices.get(key);
	}

	public isVertexPartOfStronglyConnectedComponent(publicKey: PublicKey) {
		return this._stronglyConnectedVertices.has(publicKey);
	}

	public isEdgePartOfNetworkTransitiveQuorumSet(edge: Edge) {
		return (
			this._networkTransitiveQuorumSet.has(edge.parent.key) &&
			this._networkTransitiveQuorumSet.has(edge.child.key)
		);
	}

	public isEdgePartOfStronglyConnectedComponent(edge: Edge) {
		return (
			this._stronglyConnectedVertices.has(edge.parent.key) &&
			this._stronglyConnectedVertices.has(edge.child.key) &&
			this._stronglyConnectedVertices.get(edge.parent.key) ===
				this._stronglyConnectedVertices.get(edge.child.key)
		);
	}

	public hasVertex(publicKey: PublicKey) {
		return this._vertices.has(publicKey);
	}

	public getVertex(publicKey: PublicKey) {
		return this._vertices.get(publicKey);
	}

	public getChildren(vertex: Vertex): Set<Vertex> {
		if (!this.vertices.has(vertex.key)) {
			throw new Error('Vertex not part of graph: ' + vertex);
		}
		return this.children.get(vertex.key)!;
	}

	public getTransitiveChildren(vertex: Vertex): Set<Vertex> {
		const children = new Set<Vertex>();

		const getChildrenRecursive = (vertex: Vertex, children: Set<Vertex>) => {
			this.getChildren(vertex).forEach((child) => {
				if (!children.has(child)) {
					children.add(child);
					getChildrenRecursive(child, children);
				}
			});
		};

		getChildrenRecursive(vertex, children);

		return children;
	}

	public hasChild(parent: Vertex, child: Vertex): boolean {
		const children = this.children.get(parent.key);
		if (!children) return false;

		return children.has(child);
	}

	public getParents(vertex: Vertex): Set<Vertex> {
		if (!this.vertices.has(vertex.key)) {
			throw new Error('Vertex not part of graph: ' + vertex);
		}
		return this.parents.get(vertex.key)!;
	}

	public addEdge(edge: Edge) {
		if (!this._vertices.has(edge.parent.key)) {
			throw new Error('unknown vertex: ' + edge.parent);
		}
		if (!this._vertices.has(edge.child.key)) {
			throw new Error('unknown vertex: ' + edge.child);
		}

		this._edges.add(edge);
		this.children.get(edge.parent.key)!.add(edge.child);
		this.parents.get(edge.child.key)!.add(edge.parent);
	}

	public get vertices() {
		return this._vertices;
	}

	public get edges() {
		return this._edges;
	}

	public get stronglyConnectedComponents() {
		return this._stronglyConnectedComponents;
	}
}
