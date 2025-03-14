import { Node } from '../Node';
import { QuorumSet } from '../QuorumSet';

describe('Node', () => {
	describe('toJSON', () => {
		it('should correctly serialize the Node to JSON', () => {
			const quorumSet = new QuorumSet(2, ['validator1', 'validator2'], []);
			const node = new Node('node1', quorumSet);

			const json = node.toJSON();

			expect(json).toEqual({
				publicKey: 'node1',
				quorumSet: {
					threshold: 2,
					validators: ['validator1', 'validator2'],
					innerQuorumSets: []
				}
			});
		});
	});

	describe('fromJSON', () => {
		it('should correctly deserialize from JSON to Node', () => {
			const json = {
				publicKey: 'node1',
				quorumSet: {
					threshold: 2,
					validators: ['validator1', 'validator2'],
					innerQuorumSets: []
				}
			};

			const node = Node.fromJSON(json);

			expect(node.publicKey).toBe('node1');
			expect(node.quorumSet).toBeInstanceOf(QuorumSet);
			expect(node.quorumSet.threshold).toBe(2);
			expect(node.quorumSet.validators).toEqual(['validator1', 'validator2']);
			expect(node.quorumSet.innerQuorumSets).toEqual([]);
		});
	});

	describe('serialization roundtrip', () => {
		it('should maintain data integrity through serialization and deserialization', () => {
			const quorumSet = new QuorumSet(3, ['v1', 'v2', 'v3'], []);
			const originalNode = new Node('originalKey', quorumSet);

			const json = originalNode.toJSON();
			const deserializedNode = Node.fromJSON(json);

			expect(deserializedNode.publicKey).toBe(originalNode.publicKey);
			expect(deserializedNode.quorumSet.threshold).toBe(
				originalNode.quorumSet.threshold
			);
			expect(deserializedNode.quorumSet.validators).toEqual(
				originalNode.quorumSet.validators
			);
			expect(deserializedNode.quorumSet.innerQuorumSets).toEqual(
				originalNode.quorumSet.innerQuorumSets
			);
		});
	});
});
