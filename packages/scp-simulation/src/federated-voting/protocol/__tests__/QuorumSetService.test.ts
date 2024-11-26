import assert from 'node:assert';
import { QuorumSet } from '../../../core';
import { QuorumSetService } from '../QuorumSetService';

describe('QuorumSetService', () => {
	describe('isSetVBlocking for validators arrays', () => {
		const quorumSetOfV = new QuorumSet(1, ['A', 'B'], []);

		it('is VBlocking', () => {
			const nodeSet = ['A', 'B'];
			assert.strictEqual(
				QuorumSetService.isSetVBlocking(nodeSet, quorumSetOfV),
				true
			);
		});
		it('is not VBlocking', () => {
			const nodeSet = ['A'];
			assert.strictEqual(
				QuorumSetService.isSetVBlocking(nodeSet, quorumSetOfV),
				false
			);
			assert.strictEqual(
				QuorumSetService.isSetVBlocking(['B'], quorumSetOfV),
				false
			);
		});
	});

	describe('isSetVBlocking for innerQSets arrays', () => {
		const quorumSetOfV = new QuorumSet(
			1,
			[],
			[new QuorumSet(1, ['A'], []), new QuorumSet(1, ['B'], [])]
		);

		it('is VBlocking', () => {
			assert.strictEqual(
				QuorumSetService.isSetVBlocking(['A', 'B'], quorumSetOfV),
				true
			);
		});
		it('is not VBlocking', () => {
			assert.strictEqual(
				QuorumSetService.isSetVBlocking(['A'], quorumSetOfV),
				false
			);
			assert.strictEqual(
				QuorumSetService.isSetVBlocking(['B'], quorumSetOfV),
				false
			);
		});
	});
});
