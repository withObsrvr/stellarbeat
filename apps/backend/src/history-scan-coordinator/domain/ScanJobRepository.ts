import { ScanJob } from './ScanJob';

export interface ScanJobRepository {
	hasPendingJobs: () => Promise<boolean>;
	save: (scanJobs: ScanJob[]) => Promise<void>;
	fetchNextJob: () => Promise<ScanJob | null>;
	findByRemoteId: (remoteId: string) => Promise<ScanJob | null>;
	findUnfinishedJobs: (after: Date) => Promise<ScanJob[]>;
}
