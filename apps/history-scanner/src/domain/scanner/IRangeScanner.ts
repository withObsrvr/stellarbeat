import { Result } from 'neverthrow';
import { Url } from 'http-helper';
import { ScanError } from '../scan/ScanError';
import { LedgerHeader } from './Scanner';

export interface RangeScanResult {
	latestLedgerHeader?: LedgerHeader;
	errors: ScanError[];
	exitCode: number | null; // null for TypeScript scanner
	// Every bucket hash verified so far in this scan chain. The caller feeds it
	// back into the next range so buckets referenced by more than one range are
	// not re-downloaded and re-hashed. Undefined for backends that de-duplicate
	// internally (stellar-archivist).
	scannedBucketHashes?: Set<string>;
}

export interface IRangeScanner {
	scan(
		baseUrl: Url,
		fromLedger: number,
		toLedger: number
	): Promise<Result<RangeScanResult, ScanError>>;
}
