import { Network, Node, Organization, QuorumSet } from '../../src';
import { TrustGraphBuilder } from '../../src';

const organizationA = new Organization('A', 'A');
const organizationB = new Organization('B', 'B');

const nodeA = new Node('a');
nodeA.active = true;
nodeA.isValidating = true;
nodeA.organizationId = 'A';
const nodeAA = new Node('aa');
nodeAA.active = true;
nodeAA.isValidating = true;
nodeAA.organizationId = 'A';
const nodeB = new Node('b');
nodeB.active = true;
nodeB.isValidating = true;
nodeB.organizationId = 'B';
const nodeBB = new Node('bb');
nodeBB.active = true;
nodeBB.isValidating = true;
nodeBB.organizationId = 'B';

nodeA.quorumSet.validators.push('b');
nodeA.quorumSet.threshold = 1;
nodeAA.quorumSet.validators.push('bb');
nodeAA.quorumSet.threshold = 1;
nodeB.quorumSet.validators.push('a');
nodeB.quorumSet.threshold = 1;
nodeBB.quorumSet.innerQuorumSets.push(new QuorumSet(1, ['aa']));
nodeBB.quorumSet.threshold = 1;

organizationA.validators.push(...['a', 'aa']);
organizationB.validators.push(...['b', 'bb']);

const network = new Network(
	[nodeA, nodeAA, nodeB, nodeBB],
	[organizationA, organizationB]
);
const trustGraphBuilder = new TrustGraphBuilder(network);

test('buildGraphs', () => {
	const nodesGraph = trustGraphBuilder.buildGraphFromNodes();
	const organizationsGraph =
		trustGraphBuilder.buildGraphFromOrganizations(nodesGraph);

	expect(nodesGraph.vertices.size).toEqual(4);
	expect(nodesGraph.edges.size).toEqual(4);
	expect(
		Array.from(nodesGraph.vertices.values()).filter(
			(vertex) => vertex.key === 'a'
		)
	).toHaveLength(1);
	expect(
		Array.from(nodesGraph.vertices.values()).filter(
			(vertex) => vertex.key === 'b'
		)
	).toHaveLength(1);
	expect(
		Array.from(nodesGraph.vertices.values()).filter(
			(vertex) => vertex.key === 'aa'
		)
	).toHaveLength(1);
	expect(
		Array.from(nodesGraph.vertices.values()).filter(
			(vertex) => vertex.key === 'bb'
		)
	).toHaveLength(1);

	expect(organizationsGraph.vertices.size).toEqual(2);
	expect(
		Array.from(organizationsGraph.vertices.values()).filter(
			(vertex) => vertex.key === 'A'
		)
	).toHaveLength(1);
	expect(
		Array.from(organizationsGraph.vertices.values()).filter(
			(vertex) => vertex.key === 'B'
		)
	).toHaveLength(1);
	expect(organizationsGraph.edges.size).toEqual(2);
	expect(
		Array.from(organizationsGraph.edges).filter(
			(edge) => edge.parent.key === 'A' && edge.child.key === 'B'
		)
	).toHaveLength(1);
	expect(
		Array.from(organizationsGraph.edges).filter(
			(edge) => edge.parent.key === 'B' && edge.child.key === 'A'
		)
	).toHaveLength(1);

	expect(Array.from(organizationsGraph.networkTransitiveQuorumSet)).toEqual([
		'B',
		'A'
	]);
});
