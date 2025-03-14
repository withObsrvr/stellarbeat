import { Vote } from '../Vote';
import { QuorumSet } from '../../../core';

describe('Vote', () => {
	describe('toJSON', () => {
		it('should correctly serialize the Vote to JSON', () => {
			const statement = 'test';
			const quorumSet = new QuorumSet(2, ['node2', 'node3'], []);
			const vote = new Vote(statement, true, 'node1', quorumSet);

			const json = vote.toJSON();

			expect(json).toEqual({
				publicKey: 'node1',
				statement: statement,
				quorumSet: quorumSet.toJSON(),
				isVoteToAccept: true
			});
		});
	});

	describe('fromJSON', () => {
		it('should correctly deserialize from JSON to Vote', () => {
			const json = {
				publicKey: 'node1',
				statement: 'test',
				quorumSet: {
					threshold: 2,
					validators: ['node2', 'node3'],
					innerQuorumSets: []
				},
				isVoteToAccept: true
			};

			const vote = Vote.fromJSON(json);

			expect(vote.publicKey).toBe('node1');
			expect(vote.statement).toBe('test');
			expect(vote.quorumSet).toBeInstanceOf(QuorumSet);
			expect(vote.quorumSet.threshold).toBe(2);
			expect(vote.quorumSet.validators).toEqual(['node2', 'node3']);
			expect(vote.quorumSet.innerQuorumSets).toEqual([]);
			expect(vote.isVoteToAccept).toBe(true);
		});
	});
});
