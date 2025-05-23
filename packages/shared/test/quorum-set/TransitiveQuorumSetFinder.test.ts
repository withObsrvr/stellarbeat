import {QuorumSet,TransitiveQuorumSetFinder} from "../../src";

describe('TransitiveQuorumSetFinder', () => {
	it('should find the transitive quorum set by traversing the validators array', () => {
		const quorumSetMap = new Map<string, QuorumSet>();
		const publicKey1 = 'A';
		const publicKey2 = 'B';
		const publicKey3 = 'C';
		const publicKey4 = 'D';
		const publicKey5 = 'E';


		const startingQuorumSet = new QuorumSet(1, [publicKey2, publicKey3], []);
		quorumSetMap.set(publicKey1, startingQuorumSet);
		quorumSetMap.set(publicKey2, new QuorumSet(1, [publicKey4], []));
		quorumSetMap.set(
			publicKey3,
			new QuorumSet(1, [publicKey5, publicKey1], [])
		);
		quorumSetMap.set(publicKey4, new QuorumSet(1, [publicKey1], []));
		const transitiveQuorumSet = TransitiveQuorumSetFinder.find(
			startingQuorumSet,
			quorumSetMap
		);
		assertContains(transitiveQuorumSet, [
			publicKey1,
			publicKey2,
			publicKey3,
			publicKey4,
			publicKey5
		]);
	});

	it('should find the transitive quorum set by traversing inner quorum sets', function () {
		const quorumSetMap = new Map<string, QuorumSet>();
		const publicKey1 = 'A';
		const publicKey2 = 'B';
		const publicKey3 = 'C';
		const publicKey4 = 'D';
		const publicKey5 = 'E';


		const quorumSet1 = new QuorumSet(
			1,
			[],
			[
				new QuorumSet(1, [publicKey2], []),
				new QuorumSet(1, [publicKey2], [new QuorumSet(1, [publicKey3], [])])
			]
		);
		const quorumSet2 = new QuorumSet(
			1,
			[],
			[new QuorumSet(1, [publicKey4], [])]
		);
		const quorumSet3 = new QuorumSet(
			1,
			[],
			[new QuorumSet(1, [publicKey5], [])]
		);
		const quorumSet4 = new QuorumSet(
			1,
			[],
			[new QuorumSet(1, [publicKey1], [])]
		);
		quorumSetMap.set(publicKey1, quorumSet1);
		quorumSetMap.set(publicKey2, quorumSet2);
		quorumSetMap.set(publicKey3, quorumSet3);
		quorumSetMap.set(publicKey4, quorumSet4);
		const transitiveQuorumSet = TransitiveQuorumSetFinder.find(
			quorumSet1,
			quorumSetMap
		);
		assertContains(transitiveQuorumSet, [
			publicKey1,
			publicKey2,
			publicKey3,
			publicKey4,
			publicKey5
		]);
	});

	function assertContains(
		transitiveQuorumSet: Set<string>,
		publicKeys: string[]
	) {
		expect(transitiveQuorumSet.size).toBe(publicKeys.length);
		publicKeys.forEach((publicKey) => {
			expect(transitiveQuorumSet.has(publicKey)).toBe(true);
		});
	}
});
