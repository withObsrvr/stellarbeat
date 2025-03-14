import { AddNode } from '../AddNode';
import { QuorumSet } from '../../../../core';

describe('AddNode', () => {
	const nodeKey = 'node1';
	const quorumSet = new QuorumSet(2, ['node2', 'node3'], []);
	let action: AddNode;

	beforeEach(() => {
		action = new AddNode(nodeKey, quorumSet);
	});

	describe('toJSON', () => {
		it('should serialize the action correctly', () => {
			const json = action.toJSON();
			expect(json).toEqual({
				type: 'UserAction',
				subType: 'AddNode',
				publicKey: nodeKey,
				quorumSet: quorumSet.toJSON()
			});
		});
	});

	describe('fromJSON', () => {
		it('should deserialize the action correctly', () => {
			const json = {
				type: 'UserAction',
				subType: 'AddNode',
				publicKey: nodeKey,
				quorumSet: quorumSet.toJSON()
			};
			const deserialized = AddNode.fromJSON(json);
			expect(deserialized).toBeInstanceOf(AddNode);
			expect(deserialized.publicKey).toBe(nodeKey);
			expect(deserialized.quorumSet).toEqual(quorumSet);
		});
	});

	describe('serialization round trip', () => {
		it('should maintain action properties after serialization and deserialization', () => {
			const json = action.toJSON();
			const deserialized = AddNode.fromJSON(json);
			expect(deserialized.publicKey).toBe(action.publicKey);
			expect(deserialized.quorumSet).toEqual(action.quorumSet);
			expect(deserialized.toString()).toBe(action.toString());
		});
	});
});
