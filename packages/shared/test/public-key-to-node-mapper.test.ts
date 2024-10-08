import { Node } from '../src';
import { getPublicKeysToNodesMap } from '../src';

test('mapper', () => {
	const node1 = new Node('a');

	const node2 = new Node('b');

	const nodesMap = getPublicKeysToNodesMap([node1, node2]);

	expect(nodesMap.get('a')).toEqual(node1);
	expect(nodesMap.get('b')).toEqual(node2);
});
