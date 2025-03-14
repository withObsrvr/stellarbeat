import { RemoveConnection } from '../RemoveConnection';

describe('RemoveConnection', () => {
	const nodeA = 'nodeA';
	const nodeB = 'nodeB';
	let action: RemoveConnection;

	beforeEach(() => {
		action = new RemoveConnection(nodeA, nodeB);
	});

	describe('toJSON', () => {
		it('should serialize the action correctly', () => {
			const json = action.toJSON();
			expect(json).toEqual({
				type: 'UserAction',
				subType: 'RemoveConnection',
				a: nodeA,
				b: nodeB
			});
		});
	});

	describe('fromJSON', () => {
		it('should deserialize the action correctly', () => {
			const json = {
				type: 'UserAction',
				subType: 'RemoveConnection',
				a: nodeA,
				b: nodeB
			};
			const deserialized = RemoveConnection.fromJSON(json);
			expect(deserialized).toBeInstanceOf(RemoveConnection);
			expect(deserialized.a).toBe(nodeA);
			expect(deserialized.b).toBe(nodeB);
			expect(deserialized.publicKey).toBe(nodeA);
		});
	});

	describe('serialization round trip', () => {
		it('should maintain action properties after serialization and deserialization', () => {
			const json = action.toJSON();
			const deserialized = RemoveConnection.fromJSON(json);
			expect(deserialized.a).toBe(action.a);
			expect(deserialized.b).toBe(action.b);
			expect(deserialized.publicKey).toBe(action.publicKey);
			expect(deserialized.toString()).toBe(action.toString());
		});
	});
});
