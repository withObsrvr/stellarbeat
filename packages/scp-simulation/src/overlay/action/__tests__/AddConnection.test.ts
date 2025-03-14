import { AddConnection } from '../AddConnection';

describe('AddConnection', () => {
	const nodeA = 'nodeA';
	const nodeB = 'nodeB';
	let action: AddConnection;

	beforeEach(() => {
		action = new AddConnection(nodeA, nodeB);
	});

	describe('toJSON', () => {
		it('should serialize the action correctly', () => {
			const json = action.toJSON();
			expect(json).toEqual({
				type: 'UserAction',
				subType: 'AddConnection',
				a: nodeA,
				b: nodeB
			});
		});
	});

	describe('fromJSON', () => {
		it('should deserialize the action correctly', () => {
			const json = {
				type: 'UserAction',
				subType: 'AddConnection',
				a: nodeA,
				b: nodeB
			};
			const deserialized = AddConnection.fromJSON(json);
			expect(deserialized).toBeInstanceOf(AddConnection);
			expect(deserialized.a).toBe(nodeA);
			expect(deserialized.b).toBe(nodeB);
			expect(deserialized.publicKey).toBe(nodeA);
		});
	});

	describe('serialization round trip', () => {
		it('should maintain action properties after serialization and deserialization', () => {
			const json = action.toJSON();
			const deserialized = AddConnection.fromJSON(json);
			expect(deserialized.a).toBe(action.a);
			expect(deserialized.b).toBe(action.b);
			expect(deserialized.publicKey).toBe(action.publicKey);
			expect(deserialized.toString()).toBe(action.toString());
		});
	});
});
