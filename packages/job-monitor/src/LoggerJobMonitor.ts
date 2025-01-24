import { JobMonitor, MonitoringJob } from './JobMonitor';
import { Logger } from 'logger';
import { ok } from 'neverthrow';

export class LoggerJobMonitor implements JobMonitor {
	constructor(private logger: Logger) {}

	async checkIn(job: MonitoringJob) {
		this.logger.info('Job check-in', {
			job
		});

		return ok(undefined);
	}
}
