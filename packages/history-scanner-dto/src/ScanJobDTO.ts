import { Result, ok, err } from 'neverthrow';

/**
 * Represents a scan job.
 * A request to scan a specific URL starting from a specific ledger.
 */
export class ScanJobDTO {
	constructor(
		public readonly url: string,
		public readonly latestScannedLedger: number,
		public readonly latestScannedLedgerHeaderHash: string | null,
		public readonly chainInitDate: Date | null,
		public readonly remoteId: string
	) {}

	static fromJSON(json: Record<string, unknown>): Result<ScanJobDTO, Error> {
		if (!this.isValidScanJobJSON(json)) {
			return err(new Error('Invalid ScanJobDTO JSON format'));
		}

		return ok(
			new ScanJobDTO(
				json.url,
				json.latestScannedLedger,
				json.latestScannedLedgerHeaderHash,
				json.chainInitDate ? new Date(json.chainInitDate) : null,
				json.remoteId
			)
		);
	}

	private static isValidScanJobJSON(
		json: Record<string, unknown>
	): json is ScanJobJSON {
		return (
			typeof json === 'object' &&
			json !== null &&
			typeof json.url === 'string' &&
			typeof json.latestScannedLedger === 'number' &&
			Number.isInteger(json.latestScannedLedger) &&
			(json.latestScannedLedgerHeaderHash === null ||
				typeof json.latestScannedLedgerHeaderHash === 'string') &&
			(json.chainInitDate === null ||
				(typeof json.chainInitDate === 'string' &&
					!isNaN(new Date(json.chainInitDate).getTime()))) &&
			typeof json.remoteId === 'string'
		);
	}
}

interface ScanJobJSON extends Record<string, unknown> {
	url: string;
	latestScannedLedger: number;
	latestScannedLedgerHeaderHash: string | null;
	chainInitDate: string | null;
	remoteId: string;
}
