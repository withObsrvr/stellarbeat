import { Node } from '../../src';
import { QuorumSet } from '../../src/federated-voting/QuorumSet';
import assert from 'node:assert';

describe('Node', () => {
	it('should update quorumSet', () => {
		const node = new Node('A', new QuorumSet(1, ['B'], []));
		const quorumSet = new QuorumSet(1, ['C'], []);
		node.updateQuorumSet(quorumSet);
		assert.strictEqual(node.quorumSet, quorumSet);
	});

	describe('part of quorumCandidate is a quorum', () => {
		const quorumCandidate = new Map<string, QuorumSet>();

		beforeEach(() => {
			quorumCandidate.set('A', new QuorumSet(1, ['B'], []));
			quorumCandidate.set('B', new QuorumSet(1, ['A'], []));
			quorumCandidate.set('C', new QuorumSet(2, ['F', 'G'], []));
		});

		it('should be a quorum with V as member', () => {
			const node = new Node('V', new QuorumSet(1, ['B'], []));
			const quorumOrNull = node.isQuorum(quorumCandidate);

			assert.notStrictEqual(quorumOrNull, null);
			if (quorumOrNull === null) {
				return;
			}
			assert.deepEqual(Array.from(quorumOrNull.keys()), ['A', 'B']);
		});

		it('should not be a quorum with V as member', () => {
			const node = new Node('V', new QuorumSet(1, ['C'], []));
			assert.strictEqual(node.isQuorum(quorumCandidate), null);
		});

		describe('quorumCandidate is not a quorum', () => {
			const quorumCandidate = new Map<string, QuorumSet>();

			beforeEach(() => {
				quorumCandidate.set('A', new QuorumSet(2, ['B', 'C', 'D'], []));
				quorumCandidate.set('B', new QuorumSet(2, ['A', 'C', 'D'], []));
			});

			it('should not be quorum with V as member', () => {
				const node = new Node('V', new QuorumSet(1, ['B'], []));
				assert.strictEqual(node.isQuorum(quorumCandidate), null);
			});
		});

		describe('quorumCandidate is a quorum', () => {
			const quorumCandidate = new Map<string, QuorumSet>();
			beforeEach(() => {
				quorumCandidate.set('A', new QuorumSet(2, ['B', 'C', 'D'], []));
				quorumCandidate.set('B', new QuorumSet(2, ['A', 'C', 'D'], []));
				quorumCandidate.set('C', new QuorumSet(2, ['B', 'A', 'D'], []));
				quorumCandidate.set('D', new QuorumSet(2, ['B', 'C', 'A'], []));
			});

			it('is a quorum with V as a member', () => {
				const node = new Node('V', new QuorumSet(2, ['B', 'C', 'A'], []));
				const quorumOrNull = node.isQuorum(quorumCandidate);
				assert.notStrictEqual(quorumOrNull, null);
				if (quorumOrNull === null) {
					return;
				}
				assert.deepEqual(Array.from(quorumOrNull.keys()), ['A', 'B', 'C', 'D']);
			});

			it('is not a quorum with V as a member', () => {
				const node = new Node('V', new QuorumSet(2, ['BB', 'CC', 'AA'], []));
				assert.strictEqual(node.isQuorum(quorumCandidate), null);
			});
		});
	});
});
