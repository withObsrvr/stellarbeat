import { mock } from 'jest-mock-extended';
import { Logger } from '../LoggerJobMonitor';
import { MonitoringJob } from '../JobMonitor';
import { LoggerJobMonitor } from '../LoggerJobMonitor';

describe('LoggerJobMonitor', () => {
	test('should log job check in', async () => {
		const logger = mock<Logger>();
		const job: MonitoringJob = {
			context: 'context',
			status: 'ok'
		};

		const loggerJobMonitor = new LoggerJobMonitor(logger);
		await loggerJobMonitor.checkIn(job);

		expect(logger.info).toHaveBeenCalledTimes(1);
		expect(logger.info).toHaveBeenCalledWith('Job check-in', { job });
	});
});
