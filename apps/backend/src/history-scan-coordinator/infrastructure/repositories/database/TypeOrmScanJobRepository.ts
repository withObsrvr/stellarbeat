import { injectable } from 'inversify';
import { ScanJobRepository } from '../../../domain/ScanJobRepository';
import { ScanJob } from '../../../domain/ScanJob';
import { Repository } from 'typeorm';

@injectable()
export class TypeOrmScanJobRepository implements ScanJobRepository {
	constructor(private baseRepository: Repository<ScanJob>) {}

	async save(scanJobs: ScanJob[]): Promise<void> {
		await this.baseRepository.save(scanJobs);
	}

	async fetchNextJob(): Promise<ScanJob | null> {
		return await this.baseRepository.findOne({
			where: {
				status: 'PENDING'
			},
			order: {
				id: 'ASC' //fifo queue
			}
		});
	}

	async hasPendingJobs(): Promise<boolean> {
		return (
			(await this.baseRepository.count({ where: { status: 'PENDING' } })) > 0
		);
	}
}
