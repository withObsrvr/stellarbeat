import { Node } from '../../src';
import assert from 'node:assert';
import { QuorumSet } from '../../src/node/QuorumSet';
import { QuorumService } from '../../src/federated-voting/QuorumService';

describe('QuorumService', () => {
	describe('part of quorumCandidate is a quorum', () => {
		let quorumCandidate: Map<string, QuorumSet>;

		beforeEach(() => {
			quorumCandidate = new Map<string, QuorumSet>();
			quorumCandidate.set('A', new QuorumSet(1, ['B'], []));
			quorumCandidate.set('B', new QuorumSet(1, ['A'], []));
			quorumCandidate.set('C', new QuorumSet(2, ['F', 'G'], []));
		});

		it('should be a quorum with V as member', () => {
			const quorumSetOfV = new QuorumSet(1, ['B'], []);
			quorumCandidate.set('V', quorumSetOfV);
			const quorumOrNull = QuorumService.isQuorum(
				'V',
				quorumSetOfV,
				quorumCandidate
			);

			expect(quorumOrNull).not.toBe(null);
			if (quorumOrNull === null) {
				return;
			}
			expect(Array.from(quorumOrNull.keys()).sort()).toEqual(
				['V', 'A', 'B'].sort()
			);
		});

		it('should only be a quorum if it contains itself', () => {
			const quorumSetOfV = new QuorumSet(1, ['B'], []);
			const quorumOrNull = QuorumService.isQuorum(
				'V',
				quorumSetOfV,
				quorumCandidate
			);
			assert.strictEqual(quorumOrNull, null);
		});

		it('should not be a quorum with V as member', () => {
			const quorumSetOfV = new QuorumSet(1, ['C'], []);
			assert.strictEqual(
				QuorumService.isQuorum('V', quorumSetOfV, quorumCandidate),
				null
			);
		});

		describe('quorumCandidate is not a quorum', () => {
			const quorumCandidate = new Map<string, QuorumSet>();

			beforeEach(() => {
				quorumCandidate.set('A', new QuorumSet(2, ['B', 'C', 'D'], []));
				quorumCandidate.set('B', new QuorumSet(2, ['A', 'C', 'D'], []));
			});

			it('should not be quorum with V as member', () => {
				const quorumSetOfV = new QuorumSet(1, ['D'], []);
				assert.strictEqual(
					QuorumService.isQuorum('V', quorumSetOfV, quorumCandidate),
					null
				);
			});
		});
	});
});
