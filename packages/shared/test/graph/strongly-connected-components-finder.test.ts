import { Node, Network } from '../../src';
import { StronglyConnectedComponentsFinder } from '../../src/trust-graph/strongly-connected-components-finder';
import { TrustGraphBuilder } from '../../src';
import * as _ from 'lodash';

//https://www.youtube.com/watch?v=TyWtx7q2D7Y

const node1 = new Node('1');
node1.active = true;
node1.isValidating = true;
const node2 = new Node('2');
node2.active = true;
node2.isValidating = true;
const node3 = new Node('3');
node3.active = true;
node3.isValidating = true;
const node4 = new Node('4');
node4.active = true;
node4.isValidating = true;
const node5 = new Node('5');
node5.active = true;
node5.isValidating = true;
const node6 = new Node('6');
node6.active = true;
node6.isValidating = true;
const node7 = new Node('7');
node7.active = true;
node7.isValidating = true;
const node8 = new Node('8');
node8.active = true;
node8.isValidating = true;

//another strongly connected component without outgoing _edges, that is not the transitive quorumset
const node9 = new Node('9');
node9.active = true;
node9.isValidating = true;
const node10 = new Node('10');
node10.active = true;
node10.isValidating = true;

node1.quorumSet.threshold = 1;
node2.quorumSet.threshold = 1;
node3.quorumSet.threshold = 1;
node4.quorumSet.threshold = 1;
node5.quorumSet.threshold = 1;
node6.quorumSet.threshold = 1;
node7.quorumSet.threshold = 1;
node8.quorumSet.threshold = 1;
node9.quorumSet.threshold = 1;
node10.quorumSet.threshold = 1;

node1.quorumSet.validators.push(node2.publicKey);
node1.quorumSet.validators.push(node5.publicKey);
node2.quorumSet.validators.push(node6.publicKey);
node3.quorumSet.validators.push(node2.publicKey);
node3.quorumSet.validators.push(node4.publicKey);
node3.quorumSet.validators.push(node7.publicKey);
node4.quorumSet.validators.push(node7.publicKey);
node5.quorumSet.validators.push(node1.publicKey);
node5.quorumSet.validators.push(node6.publicKey);
node6.quorumSet.validators.push(node3.publicKey);
node6.quorumSet.validators.push(node7.publicKey);
node7.quorumSet.validators.push(node8.publicKey);
node8.quorumSet.validators.push(node4.publicKey);

node9.quorumSet.validators.push(node10.publicKey);
node10.quorumSet.validators.push(node9.publicKey);

const network = new Network([
	node7,
	node1,
	node2,
	node3,
	node4,
	node5,
	node6,
	node8,
	node9,
	node10
]);
const directedGraphManager = new TrustGraphBuilder(network);

test('findTarjan', function () {
	const graph = directedGraphManager.buildGraphFromNodes();
	const dfs = new StronglyConnectedComponentsFinder();
	const results = dfs.findTarjan(graph);

	expect(results.length).toEqual(4);

	expect(
		results.find((scp) => _.isEqual(scp, new Set(['2', '3', '6'])))
	).toBeTruthy();

	expect(
		results.find((scp) => _.isEqual(scp, new Set(['4', '7', '8'])))
	).toBeTruthy();

	expect(
		results.find((scp) => _.isEqual(scp, new Set(['1', '5'])))
	).toBeTruthy();

	expect(
		results.find((scp) => _.isEqual(scp, new Set(['9', '10'])))
	).toBeTruthy();
});

test('findTarjanFailingNodes', function () {
	node7.isValidating = false;
	node8.isValidating = false;
	const graph = directedGraphManager.buildGraphFromNodes();
	const dfs = new StronglyConnectedComponentsFinder();
	const results = dfs.findTarjan(graph);

	expect(results.length).toEqual(4); //failed nodes not filtered from scp
	expect(
		results.find((scp) => _.isEqual(scp, new Set(['2', '3', '6'])))
	).toBeTruthy();

	expect(
		results.find((scp) => _.isEqual(scp, new Set(['4', '7', '8'])))
	).toBeTruthy();

	expect(
		results.find((scp) => _.isEqual(scp, new Set(['1', '5'])))
	).toBeTruthy();

	expect(
		results.find((scp) => _.isEqual(scp, new Set(['9', '10'])))
	).toBeTruthy();
});
