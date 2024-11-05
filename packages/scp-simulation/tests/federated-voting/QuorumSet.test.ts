import assert from 'node:assert';
import { QuorumSet } from '../../src/federated-voting/QuorumSet';

describe('QuorumSet', () => {
	describe('isSetVBlocking for validators arrays', () => {
		const quorumSetOfV = new QuorumSet(1, ['A', 'B'], []);

		it('is VBlocking', () => {
			const nodeSet = ['A', 'B'];
			assert.strictEqual(quorumSetOfV.isSetVBlocking(nodeSet), true);
		});
		it('is not VBlocking', () => {
			assert.strictEqual(quorumSetOfV.isSetVBlocking(['A']), false);
			assert.strictEqual(quorumSetOfV.isSetVBlocking(['B']), false);
		});
	});

	describe('isSetVBlocking for innerQSets arrays', () => {
		const quorumSetOfV = new QuorumSet(
			1,
			[],
			[new QuorumSet(1, ['A'], []), new QuorumSet(1, ['B'], [])]
		);

		it('is VBlocking', () => {
			assert.strictEqual(quorumSetOfV.isSetVBlocking(['A', 'B']), true);
		});
		it('is not VBlocking', () => {
			assert.strictEqual(quorumSetOfV.isSetVBlocking(['B']), false);
			assert.strictEqual(quorumSetOfV.isSetVBlocking(['A']), false);
		});
	});
});
