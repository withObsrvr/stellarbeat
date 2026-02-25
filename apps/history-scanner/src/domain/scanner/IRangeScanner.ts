import { Result } from 'neverthrow';
import { Url } from 'http-helper';
import { ScanError } from '../scan/ScanError';
import { LedgerHeader } from './Scanner';

export interface RangeScanResult {
	latestLedgerHeader?: LedgerHeader;
	errors: ScanError[];
	exitCode: number | null; // null for TypeScript scanner
}

export interface IRangeScanner {
	scan(
		baseUrl: Url,
		fromLedger: number,
		toLedger: number
	): Promise<Result<RangeScanResult, ScanError>>;
}
