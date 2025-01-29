import { Result } from 'neverthrow';
import { Scan } from './Scan';
import { ScanJobDTO } from 'history-scanner-dto';

export interface ScanCoordinatorService {
	registerScan(scan: Scan): Promise<Result<void, Error>>;
	getScanJobs(): Promise<Result<ScanJobDTO[], Error>>;
}
