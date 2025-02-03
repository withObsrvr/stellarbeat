import { mock, MockProxy } from 'jest-mock-extended';
import { GetScanJob } from '../GetScanJob';
import { ScanJobRepository } from '../../../domain/ScanJobRepository';
import { ExceptionLogger } from '../../../../core/services/ExceptionLogger';
import { Logger } from 'logger';
import { ok } from 'neverthrow';
import { ScanJob } from '../../../domain/ScanJob';

describe('GetScanJob', () => {
	let getScanJob: GetScanJob;
	let scanJobRepositoryMock: MockProxy<ScanJobRepository>;
	let exceptionLoggerMock: MockProxy<ExceptionLogger>;
	let loggerMock: MockProxy<Logger>;

	beforeEach(() => {
		scanJobRepositoryMock = mock<ScanJobRepository>();
		exceptionLoggerMock = mock<ExceptionLogger>();
		loggerMock = mock<Logger>();

		getScanJob = new GetScanJob(
			scanJobRepositoryMock,
			exceptionLoggerMock,
			loggerMock
		);
	});

	it('should return ok(null) when no scan job is available', async () => {
		scanJobRepositoryMock.fetchNextJob.mockResolvedValue(null);
		const result = await getScanJob.execute();

		expect(result.isOk()).toBe(true);
		expect(result._unsafeUnwrap()).toBeNull();
		expect(loggerMock.info).toHaveBeenCalledWith('No scan jobs available', {
			app: 'history-scan-coordinator'
		});
	});

	it('should return ok(job) when a scan job is available and update its status to TAKEN', async () => {
		const mockJob = new ScanJob('http://test.com');
		scanJobRepositoryMock.fetchNextJob.mockResolvedValue(mockJob);

		const result = await getScanJob.execute();

		expect(result).toEqual(ok(mockJob));
		expect(loggerMock.info).toHaveBeenCalledWith('Returning next scan job', {
			app: 'history-scan-coordinator',
			url: 'http://test.com',
			chainInitDate: mockJob.chainInitDate
		});

		expect(scanJobRepositoryMock.save).toHaveBeenCalledWith([
			{
				...mockJob,
				status: 'TAKEN'
			}
		]);
	});

	it('should return err(error) when fetchNextJob fails', async () => {
		const error = new Error('Database error');
		scanJobRepositoryMock.fetchNextJob.mockRejectedValueOnce(error);

		const result = await getScanJob.execute();

		expect(result.isErr()).toBe(true);
		expect(result._unsafeUnwrapErr()).toEqual(error);
		expect(exceptionLoggerMock.captureException).toHaveBeenCalledWith(error);
	});
});
