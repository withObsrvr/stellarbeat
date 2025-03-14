import { RemoveNode } from '../RemoveNode';

describe('RemoveNode', () => {
	const nodeKey = 'node1';
	let action: RemoveNode;

	beforeEach(() => {
		action = new RemoveNode(nodeKey);
	});

	describe('toJSON', () => {
		it('should serialize the action correctly', () => {
			const json = action.toJSON();
			expect(json).toEqual({
				type: 'UserAction',
				subType: 'RemoveNode',
				publicKey: nodeKey
			});
		});
	});

	describe('fromJSON', () => {
		it('should deserialize the action correctly', () => {
			const json = {
				type: 'UserAction',
				subType: 'RemoveNode',
				publicKey: nodeKey
			};
			const deserialized = RemoveNode.fromJSON(json);
			expect(deserialized).toBeInstanceOf(RemoveNode);
			expect(deserialized.publicKey).toBe(nodeKey);
		});
	});

	describe('serialization round trip', () => {
		it('should maintain action properties after serialization and deserialization', () => {
			const json = action.toJSON();
			const deserialized = RemoveNode.fromJSON(json);
			expect(deserialized.publicKey).toBe(action.publicKey);
			expect(deserialized.toString()).toBe(action.toString());
		});
	});
});
