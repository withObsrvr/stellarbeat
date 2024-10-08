import { QuorumSet, QuorumSetService, Node, Network } from '../src';

const node0 = new Node('0');
node0.active = true;
node0.isValidating = true;
node0.quorumSet.threshold = 0;
const node1 = new Node('1');
node1.active = true;
node1.isValidating = true;
node1.quorumSet.threshold = 0;
const node2 = new Node('2');
node2.active = true;
node2.isValidating = true;
node2.quorumSet.threshold = 0;

const map = new Map();
map.set('0', node0);
map.set('1', node1);
map.set('2', node2);

const network = new Network([node0, node1, node2]);
describe('canReachThreshold', () => {
	test('basic true', () => {
		const qs = new QuorumSet(2, ['1', '2']);
		expect(
			QuorumSetService.quorumSetCanReachThreshold(
				qs,
				network,
				network.blockedNodes
			)
		).toBeTruthy();
	});
	test('true with self included', () => {
		const qs = new QuorumSet(3, ['0', '1', '2']);
		expect(
			QuorumSetService.quorumSetCanReachThreshold(
				qs,
				network,
				network.blockedNodes
			)
		).toBeTruthy();
	});

	test('basic false', () => {
		const qs = new QuorumSet(4, ['0', '1', '2']);
		expect(
			QuorumSetService.quorumSetCanReachThreshold(
				qs,
				network,
				network.blockedNodes
			)
		).toBeFalsy();
	});

	test('innerQS', () => {
		const qs = new QuorumSet(
			2,
			[],
			[new QuorumSet(2, ['0', '1', '2']), new QuorumSet(1, ['1'])]
		);
		expect(
			QuorumSetService.quorumSetCanReachThreshold(
				qs,
				network,
				network.blockedNodes
			)
		).toBeTruthy();
	});
	test('innerInnerQS', () => {
		const qs = new QuorumSet(
			2,
			[],
			[
				new QuorumSet(2, ['1'], [new QuorumSet(1, ['2'])]),
				new QuorumSet(1, ['1'])
			]
		);
		expect(
			QuorumSetService.quorumSetCanReachThreshold(
				qs,
				network,
				network.blockedNodes
			)
		).toBeTruthy();
	});
});
