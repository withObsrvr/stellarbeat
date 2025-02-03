import { Result } from 'neverthrow';
import { HistoryArchiveScan } from 'shared';

export interface HistoryArchiveScanService {
	findLatestScans(): Promise<Result<HistoryArchiveScan[], Error>>;
	scheduleScans(historyArchiveUrls: string[]): Promise<Result<void, Error>>;
}
