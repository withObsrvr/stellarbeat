import { mock, MockProxy } from 'jest-mock-extended';
import { ScheduleScanJobs } from '../ScheduleScanJobs';
import { ScanRepository } from '../../../domain/scan/ScanRepository';
import { ScanJobRepository } from '../../../domain/ScanJobRepository';
import { ScanScheduler } from '../../../domain/ScanScheduler';
import { Logger } from 'logger';
import { ScanJob } from '../../../domain/ScanJob';

describe('ScheduleScanJobs', () => {
	let scheduleScanJobs: ScheduleScanJobs;
	let scanRepositoryMock: MockProxy<ScanRepository>;
	let scanJobRepositoryMock: MockProxy<ScanJobRepository>;
	let scanSchedulerMock: MockProxy<ScanScheduler>;
	let loggerMock: MockProxy<Logger>;

	beforeEach(() => {
		scanRepositoryMock = mock<ScanRepository>();
		scanJobRepositoryMock = mock<ScanJobRepository>();
		scanSchedulerMock = mock<ScanScheduler>();
		loggerMock = mock<Logger>();

		scheduleScanJobs = new ScheduleScanJobs(
			scanRepositoryMock,
			scanJobRepositoryMock,
			scanSchedulerMock,
			loggerMock
		);
	});

	it('should do nothing if queue is not empty', async () => {
		scanJobRepositoryMock.hasPendingJobs.mockResolvedValue(true);
		const result = await scheduleScanJobs.execute({
			historyArchiveUrls: ['https://example.com']
		});
		expect(result.isOk()).toBe(true);
		expect(scanRepositoryMock.findLatest).not.toHaveBeenCalled();
		expect(scanSchedulerMock.schedule).not.toHaveBeenCalled();
		expect(scanJobRepositoryMock.save).not.toHaveBeenCalled();
	});

	it('should schedule jobs if queue is empty', async () => {
		scanJobRepositoryMock.hasPendingJobs.mockResolvedValue(false);
		scanJobRepositoryMock.findUnfinishedJobs.mockResolvedValue([]);
		scanRepositoryMock.findLatest.mockResolvedValue([]);
		scanSchedulerMock.schedule.mockReturnValue([
			new ScanJob('https://example.com')
		]);

		const result = await scheduleScanJobs.execute({
			historyArchiveUrls: ['https://example.com']
		});

		expect(result.isOk()).toBe(true);
		expect(scanRepositoryMock.findLatest).toHaveBeenCalledTimes(1);
		expect(scanSchedulerMock.schedule).toHaveBeenCalledWith(
			['https://example.com'],
			[],
			[]
		);
		expect(scanJobRepositoryMock.save).toHaveBeenCalledTimes(1);
	});
});
