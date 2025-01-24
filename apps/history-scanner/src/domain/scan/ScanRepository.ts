import { Scan } from './Scan';

export interface ScanRepository {
	save(scans: Scan[]): Promise<Scan[]>;
	findLatest(): Promise<Scan[]>;
}
