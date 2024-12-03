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
	describe('QuorumSetCanReachThreshold', () => {
		const quorumSet = new QuorumSet(
			3,
			['A', 'B'],
			[new QuorumSet(2, ['C', 'D'], [])]
		);

		it('can not reach threshold', () => {
			expect(
				QuorumSetService.quorumSetCanReachThreshold(quorumSet, ['A'])
			).toBeFalsy();
			expect(
				QuorumSetService.quorumSetCanReachThreshold(quorumSet, ['C'])
			).toBeFalsy();
		});
		it('can reach threshold', () => {
			expect(
				QuorumSetService.quorumSetCanReachThreshold(quorumSet, [])
			).toBeTruthy();
		});
	});

	describe('calculatePotentiallyBlockedNodes', () => {
		it('should return blocked nodes', () => {
			const quorumSets = new Map([
				['A', new QuorumSet(1, ['B'], [])],
				['B', new QuorumSet(1, ['A'], [])]
			]);

			const blockedNodes = QuorumSetService.calculatePotentiallyBlockedNodes(
				quorumSets,
				['A']
			);
			expect(blockedNodes).toEqual(new Set(['B']));
		});

		it('should return cascading blocked nodes', () => {
			const quorumSets = new Map([
				['A', new QuorumSet(1, ['B'], [])],
				['B', new QuorumSet(2, ['A', 'C'], [])],
				['C', new QuorumSet(1, ['D'], [])]
			]);
			const blockedNodes = QuorumSetService.calculatePotentiallyBlockedNodes(
				quorumSets,
				['D']
			);
			expect(blockedNodes).toEqual(new Set(['A', 'B', 'C']));
		});
	});
});
