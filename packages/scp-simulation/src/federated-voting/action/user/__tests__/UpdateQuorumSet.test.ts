import { UpdateQuorumSet } from '../UpdateQuorumSet';
import { QuorumSet } from '../../../../core';

describe('UpdateQuorumSet', () => {
	const nodeKey = 'node1';
	const quorumSet = new QuorumSet(2, ['node2', 'node3'], []);
	let action: UpdateQuorumSet;

	beforeEach(() => {
		action = new UpdateQuorumSet(nodeKey, quorumSet);
	});

	describe('toJSON', () => {
		it('should serialize the action correctly', () => {
			const json = action.toJSON();
			expect(json).toEqual({
				type: 'UserAction',
				subType: 'UpdateQuorumSet',
				publicKey: nodeKey,
				quorumSet: quorumSet.toJSON()
			});
		});
	});

	describe('fromJSON', () => {
		it('should deserialize the action correctly', () => {
			const json = {
				type: 'UserAction',
				subType: 'UpdateQuorumSet',
				publicKey: nodeKey,
				quorumSet: quorumSet.toJSON()
			};
			const deserialized = UpdateQuorumSet.fromJSON(json);
			expect(deserialized).toBeInstanceOf(UpdateQuorumSet);
			expect(deserialized.publicKey).toBe(nodeKey);
			expect(deserialized.quorumSet).toEqual(quorumSet);
		});
	});

	describe('serialization round trip', () => {
		it('should maintain action properties after serialization and deserialization', () => {
			const json = action.toJSON();
			const deserialized = UpdateQuorumSet.fromJSON(json);
			expect(deserialized.publicKey).toBe(action.publicKey);
			expect(deserialized.quorumSet).toEqual(action.quorumSet);
			expect(deserialized.toString()).toBe(action.toString());
		});
	});
});
