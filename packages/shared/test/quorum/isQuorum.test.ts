import isQuorum from '../../src/quorum/isQuorum';
import { Node, QuorumSet } from '../../src';

const nodeA = new Node('A');
const nodeB = new Node('B');
const nodeC = new Node('C');
const nodeD = new Node('D');
const nodeE = new Node('E');

nodeA.quorumSet.validators = [
	nodeA.publicKey,
	nodeB.publicKey,
	nodeC.publicKey
];
nodeA.quorumSet.threshold = 3;
nodeB.quorumSet.validators = [
	nodeA.publicKey,
	nodeB.publicKey,
	nodeC.publicKey
];
nodeB.quorumSet.threshold = 3;
nodeC.quorumSet.validators = [
	nodeA.publicKey,
	nodeB.publicKey,
	nodeC.publicKey
];
nodeC.quorumSet.threshold = 3;
nodeD.quorumSet.validators = [
	nodeA.publicKey,
	nodeB.publicKey,
	nodeE.publicKey
];
nodeD.quorumSet.threshold = 3;
nodeE.quorumSet.innerQuorumSets.push(
	new QuorumSet(2, [nodeA.publicKey, nodeB.publicKey])
);
nodeE.quorumSet.innerQuorumSets.push(new QuorumSet(1, [nodeC.publicKey]));
nodeE.quorumSet.threshold = 2;

test('isQuorum', () => {
	expect(isQuorum([nodeA, nodeB, nodeC])).toBeTruthy();
	expect(isQuorum([nodeA, nodeB, nodeC, nodeD])).toBeFalsy();
	expect(isQuorum([nodeA, nodeB, nodeC, nodeE])).toBeTruthy();
});
