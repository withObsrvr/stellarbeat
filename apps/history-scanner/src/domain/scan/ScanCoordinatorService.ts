import { Result } from 'neverthrow';
import { Scan } from './Scan';

export interface PendingScanJob {
	url: string;
	latestScannedLedger: number;
	latestScannedLedgerHeaderHash: string | null;
	chainInitDate: Date | null;
}

export interface ScanCoordinatorService {
	saveScanResult(scan: Scan): Promise<Result<void, Error>>;
	getPendingScanJobs(): Promise<Result<PendingScanJob[], Error>>;
}
