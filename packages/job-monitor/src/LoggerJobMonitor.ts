import { JobMonitor, MonitoringJob } from './JobMonitor';
import { ok } from 'neverthrow';

type logFn = (
	message: string,
	obj?: Record<string, unknown>,
	...args: unknown[]
) => void;

export interface Logger {
	trace: logFn;
	debug: logFn;
	info: logFn;
	warn: logFn;
	error: logFn;
	fatal: logFn;
	getRawLogger: any;
}

export class LoggerJobMonitor implements JobMonitor {
	constructor(private logger: Logger) {}

	async checkIn(job: MonitoringJob) {
		this.logger.info('Job check-in', {
			job
		});

		return ok(undefined);
	}
}
