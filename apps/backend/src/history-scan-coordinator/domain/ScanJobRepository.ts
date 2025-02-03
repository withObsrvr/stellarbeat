import { ScanJob } from './ScanJob';

export interface ScanJobRepository {
	hasPendingJobs: () => Promise<boolean>;
	save: (scanJobs: ScanJob[]) => Promise<void>;
	fetchNextJob: () => Promise<ScanJob | null>;
}
