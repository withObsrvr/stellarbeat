import { BucketEntry, HistoryArchiveState } from './HistoryArchiveState';
import { createHash } from 'crypto';
import { err, ok, Result } from 'neverthrow';
import { mapUnknownToError } from 'shared';

const HISTORY_ARCHIVE_STATE_VERSION_WITH_HOT_ARCHIVE = 2;

function hashBuckets(buckets: BucketEntry[]): Buffer {
	const hash = createHash('sha256');
	buckets.forEach((bucket) => {
		const levelHash = createHash('sha256');
		levelHash.write(Buffer.from(bucket.curr, 'hex'));
		levelHash.write(Buffer.from(bucket.snap, 'hex'));
		hash.write(levelHash.digest());
	});
	return hash.digest();
}

export function hashBucketList(
	historyArchiveState: HistoryArchiveState
): Result<
	{
		ledger: number;
		hash: string;
	},
	Error
> {
	try {
		let finalHash: Buffer;

		if (
			historyArchiveState.version >=
				HISTORY_ARCHIVE_STATE_VERSION_WITH_HOT_ARCHIVE &&
			historyArchiveState.hotArchiveBuckets
		) {
			const hash = createHash('sha256');
			hash.write(hashBuckets(historyArchiveState.currentBuckets));
			hash.write(
				hashBuckets(historyArchiveState.hotArchiveBuckets)
			);
			finalHash = hash.digest();
		} else {
			finalHash = hashBuckets(historyArchiveState.currentBuckets);
		}

		return ok({
			ledger: historyArchiveState.currentLedger,
			hash: finalHash.toString('base64')
		});
	} catch (e) {
		console.log(e);
		return err(mapUnknownToError(e));
	}
}
