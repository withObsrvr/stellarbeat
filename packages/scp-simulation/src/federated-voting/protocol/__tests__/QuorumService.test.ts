import { Node, QuorumSet } from '../../../core';
import { QuorumService } from '../QuorumService';

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
			const quorumOrNull = QuorumService.isQuorumContainingNode(
				new Node('V', quorumSetOfV),
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
			const quorumOrNull = QuorumService.isQuorumContainingNode(
				new Node('V', quorumSetOfV),
				quorumCandidate
			);
			expect(quorumOrNull).toBe(null);
		});

		it('should not be a quorum with V as member', () => {
			const quorumSetOfV = new QuorumSet(1, ['C'], []);
			expect(
				QuorumService.isQuorumContainingNode(
					new Node('V', quorumSetOfV),
					quorumCandidate
				)
			).toBe(null);
		});

		describe('quorumCandidate is not a quorum', () => {
			const quorumCandidate = new Map<string, QuorumSet>();

			beforeEach(() => {
				quorumCandidate.set('A', new QuorumSet(2, ['B', 'C', 'D'], []));
				quorumCandidate.set('B', new QuorumSet(2, ['A', 'C', 'D'], []));
			});

			it('should not be quorum with V as member', () => {
				const quorumSetOfV = new QuorumSet(1, ['D'], []);
				expect(
					QuorumService.isQuorumContainingNode(
						new Node('V', quorumSetOfV),
						quorumCandidate
					)
				).toBe(null);
			});
		});
	});
});
