import { VoteOnStatement } from '../VoteOnStatement';

describe('VoteOnStatement', () => {
	const nodeKey = 'node1';
	const statement = 'test';
	let action: VoteOnStatement;

	beforeEach(() => {
		action = new VoteOnStatement(nodeKey, statement);
	});

	describe('toJSON', () => {
		it('should serialize the action correctly', () => {
			const json = action.toJSON();
			expect(json).toEqual({
				type: 'UserAction',
				subType: 'VoteOnStatement',
				publicKey: nodeKey,
				statement: statement
			});
		});
	});

	describe('fromJSON', () => {
		it('should deserialize the action correctly', () => {
			const json = {
				type: 'UserAction',
				subType: 'VoteOnStatement',
				publicKey: nodeKey,
				statement: statement
			};
			const deserialized = VoteOnStatement.fromJSON(json);
			expect(deserialized).toBeInstanceOf(VoteOnStatement);
			expect(deserialized.publicKey).toBe(nodeKey);
		});
	});

	describe('serialization round trip', () => {
		it('should maintain action properties after serialization and deserialization', () => {
			const json = action.toJSON();
			const deserialized = VoteOnStatement.fromJSON(json);
			expect(deserialized.publicKey).toBe(action.publicKey);
			expect(deserialized.toString()).toBe(action.toString());
		});
	});
});
