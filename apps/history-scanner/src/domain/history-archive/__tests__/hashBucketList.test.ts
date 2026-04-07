import { hashBucketList } from '../hashBucketList';
import { getDummyHistoryArchiveState } from '../__fixtures__/getDummyHistoryArchiveState';
import { HistoryArchiveState } from '../HistoryArchiveState';

it('should hash correctly for version 1 (no hot archive)', function () {
	const result = hashBucketList(getDummyHistoryArchiveState());
	expect(result.isOk()).toBeTruthy();
	if (result.isErr()) throw result.error;

	expect(result.value.ledger).toEqual(40351615);
	expect(result.value.hash).toEqual(
		'vtRf4YP8qFhI3d7AtxQsgMM1AJ60P/6e35Brm4UKJPs='
	);
});

it('should hash correctly for version 2 with hot archive buckets', function () {
	const has: HistoryArchiveState = require('../../../use-cases/verify-archives/__tests__/__fixtures__/history-0000007f.json');
	const result = hashBucketList(has);
	expect(result.isOk()).toBeTruthy();
	if (result.isErr()) throw result.error;

	expect(result.value.ledger).toEqual(127);
	expect(result.value.hash).toEqual(
		'SFDburDDa//WgdrkdwdP89jxF7UwLDqCX+MCklkQCO0='
	);
});

it('should fall back to v1 hash when version 2 has no hotArchiveBuckets', function () {
	const state = getDummyHistoryArchiveState();
	// Simulate a v2 state without hotArchiveBuckets (shouldn't happen but defensive)
	state.version = 2;
	delete (state as Partial<HistoryArchiveState>).hotArchiveBuckets;

	const v1Result = hashBucketList(getDummyHistoryArchiveState());
	const v2NoHotResult = hashBucketList(state);

	expect(v1Result.isOk()).toBeTruthy();
	expect(v2NoHotResult.isOk()).toBeTruthy();
	if (v1Result.isErr() || v2NoHotResult.isErr()) throw new Error('unexpected');

	// Without hotArchiveBuckets, should produce same hash as v1
	expect(v2NoHotResult.value.hash).toEqual(v1Result.value.hash);
});
