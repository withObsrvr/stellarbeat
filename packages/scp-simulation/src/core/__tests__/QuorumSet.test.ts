import { QuorumSet } from '../QuorumSet';

describe('QuorumSet', () => {
	describe('toJSON', () => {
		it('should correctly serialize a simple QuorumSet to JSON', () => {
			const quorumSet = new QuorumSet(2, ['v1', 'v2', 'v3'], []);

			const json = quorumSet.toJSON();

			expect(json).toEqual({
				threshold: 2,
				validators: ['v1', 'v2', 'v3'],
				innerQuorumSets: []
			});
		});

		it('should correctly serialize a QuorumSet with inner quorum sets', () => {
			const innerQuorumSet = new QuorumSet(1, ['inner1', 'inner2'], []);
			const quorumSet = new QuorumSet(1, ['v1'], [innerQuorumSet]);

			const json = quorumSet.toJSON();

			expect(json).toEqual({
				threshold: 1,
				validators: ['v1'],
				innerQuorumSets: [
					{
						threshold: 1,
						validators: ['inner1', 'inner2'],
						innerQuorumSets: []
					}
				]
			});
		});
	});

	describe('fromJSON', () => {
		it('should correctly deserialize from JSON to a simple QuorumSet', () => {
			const json = {
				threshold: 2,
				validators: ['v1', 'v2', 'v3'],
				innerQuorumSets: []
			};

			const quorumSet = QuorumSet.fromJSON(json);

			expect(quorumSet.threshold).toBe(2);
			expect(quorumSet.validators).toEqual(['v1', 'v2', 'v3']);
			expect(quorumSet.innerQuorumSets).toEqual([]);
		});

		it('should correctly deserialize from JSON to a QuorumSet with inner quorum sets', () => {
			const json = {
				threshold: 1,
				validators: ['v1'],
				innerQuorumSets: [
					{
						threshold: 1,
						validators: ['inner1', 'inner2'],
						innerQuorumSets: []
					}
				]
			};

			const quorumSet = QuorumSet.fromJSON(json);

			expect(quorumSet.threshold).toBe(1);
			expect(quorumSet.validators).toEqual(['v1']);
			expect(quorumSet.innerQuorumSets).toHaveLength(1);
			expect(quorumSet.innerQuorumSets[0].threshold).toBe(1);
			expect(quorumSet.innerQuorumSets[0].validators).toEqual([
				'inner1',
				'inner2'
			]);
		});
	});

	describe('serialization roundtrip', () => {
		it('should maintain data integrity through serialization and deserialization', () => {
			const innerQuorumSet = new QuorumSet(1, ['inner1', 'inner2'], []);
			const originalQuorumSet = new QuorumSet(
				2,
				['v1', 'v2'],
				[innerQuorumSet]
			);

			const json = originalQuorumSet.toJSON();
			const deserializedQuorumSet = QuorumSet.fromJSON(json);

			expect(deserializedQuorumSet.threshold).toBe(originalQuorumSet.threshold);
			expect(deserializedQuorumSet.validators).toEqual(
				originalQuorumSet.validators
			);
			expect(deserializedQuorumSet.innerQuorumSets).toHaveLength(1);
			expect(deserializedQuorumSet.innerQuorumSets[0].threshold).toBe(
				innerQuorumSet.threshold
			);
			expect(deserializedQuorumSet.innerQuorumSets[0].validators).toEqual(
				innerQuorumSet.validators
			);
		});
	});
});
