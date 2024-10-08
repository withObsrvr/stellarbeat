import { Network, Node, QuorumSet } from '../../src';
import { Vertex } from '../../lib';

const nodeA = new Node('a');
nodeA.active = true;
nodeA.isValidating = true;
const nodeB = new Node('b');
nodeB.active = true;
nodeB.isValidating = true;
const nodeC = new Node('c');
nodeC.active = true;
nodeC.isValidating = true;
const nodeD = new Node('d');
nodeD.active = true;
nodeD.isValidating = true;
const nodeE = new Node('e');
nodeE.active = true;
nodeE.isValidating = true;

nodeA.quorumSet.validators.push('b');
nodeA.quorumSet.threshold = 1;
nodeB.quorumSet.validators.push('a');
nodeB.quorumSet.threshold = 1;
nodeC.quorumSet.validators.push('a');
nodeC.quorumSet.threshold = 1;
nodeD.quorumSet.innerQuorumSets.push(new QuorumSet(1, ['a']));
nodeD.quorumSet.innerQuorumSets.push(new QuorumSet(1, ['e']));
nodeD.quorumSet.threshold = 1;
nodeE.quorumSet.threshold = 0;

const network = new Network([nodeA, nodeB, nodeC, nodeD, nodeE]);

test('buildGraphFromNodes', () => {
	const graph = network.nodesTrustGraph;
	expect(graph.vertices.size).toEqual(5);
	expect(graph.edges.size).toEqual(5);
	expect(graph.getParents(graph.getVertex('a') as Vertex).size).toEqual(3);
	expect(graph.getChildren(graph.getVertex('d') as Vertex).size).toEqual(2);
	expect(graph.networkTransitiveQuorumSet).toEqual(new Set(['a', 'b']));

	expect(
		Array.from(graph.edges).filter((edge) =>
			graph.isEdgePartOfStronglyConnectedComponent(edge)
		).length
	).toEqual(2);
});
test('getTransitiveChildren', () => {
	const vertexC = network.nodesTrustGraph.getVertex(nodeC.publicKey) as Vertex;
	expect(
		Array.from(network.nodesTrustGraph.getTransitiveChildren(vertexC)).map(
			(vertex) => vertex.key
		)
	).toEqual(['a', 'b']);
});
