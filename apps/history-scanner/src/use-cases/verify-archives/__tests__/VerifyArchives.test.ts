import 'reflect-metadata';
import { mock, MockProxy } from 'jest-mock-extended';
import { VerifyArchives } from '../VerifyArchives';
import { Scanner } from '../../../domain/scanner/Scanner';
import { ScanCoordinatorService } from '../../../domain/scan/ScanCoordinatorService';
import { ExceptionLogger } from 'exception-logger';
import { JobMonitor } from 'job-monitor';
import { Logger } from 'logger';
import { ok, err } from 'neverthrow';
import { ScanJobDTO } from 'history-scanner-dto';
import { Scan } from '../../../domain/scan/Scan';
import {
	ScanError,
	ScanErrorCategory,
	ScanErrorType
} from '../../../domain/scan/ScanError';
import { Url } from 'http-helper';

// Mock the asyncSleep utility to speed up tests
jest.mock('shared', () => ({
	...jest.requireActual('shared'),
	asyncSleep: jest.fn().mockResolvedValue(undefined)
}));

describe('VerifyArchives', () => {
	let verifyArchives: VerifyArchives;
	let scannerMock: MockProxy<Scanner>;
	let scanCoordinatorMock: MockProxy<ScanCoordinatorService>;
	let exceptionLoggerMock: MockProxy<ExceptionLogger>;
	let jobMonitorMock: MockProxy<JobMonitor>;
	let loggerMock: MockProxy<Logger>;

	const mockScanJobDTO: ScanJobDTO = new ScanJobDTO(
		'https://example.com',
		0,
		null,
		null,
		'test'
	);

	beforeEach(() => {
		scannerMock = mock<Scanner>();
		scanCoordinatorMock = mock<ScanCoordinatorService>();
		exceptionLoggerMock = mock<ExceptionLogger>();
		jobMonitorMock = mock<JobMonitor>();
		loggerMock = mock<Logger>();

		verifyArchives = new VerifyArchives(
			scannerMock,
			scanCoordinatorMock,
			exceptionLoggerMock,
			jobMonitorMock,
			loggerMock,
			'test-worker-1'
		);
	});

	it('should handle successful scan job execution', async () => {
		scanCoordinatorMock.getScanJob.mockResolvedValue(ok(mockScanJobDTO));
		scannerMock.perform.mockResolvedValue(
			new Scan(
				new Date(),
				new Date(),
				new Date(),
				Url.create('https://example.com')._unsafeUnwrap(),
				0,
				100
			)
		);
		jobMonitorMock.checkIn.mockResolvedValue(ok(undefined));

		await verifyArchives.execute({ persist: false, loop: false });

		expect(scanCoordinatorMock.getScanJob).toHaveBeenCalledTimes(1);
		expect(jobMonitorMock.checkIn).toHaveBeenCalled();
		expect(exceptionLoggerMock.captureException).not.toHaveBeenCalled();
		expect(scannerMock.perform).toHaveBeenCalled();
	});

	it('should check in ok when the scan reports archive defects', async () => {
		//a scan that ran and found problems did its job
		scanCoordinatorMock.getScanJob.mockResolvedValue(ok(mockScanJobDTO));
		scannerMock.perform.mockResolvedValue(
			new Scan(
				new Date(),
				new Date(),
				new Date(),
				Url.create('https://example.com')._unsafeUnwrap(),
				0,
				100,
				0,
				null,
				0,
				null,
				[
					new ScanError(
						ScanErrorType.TYPE_VERIFICATION,
						'https://example.com',
						'1 bucket hash mismatch',
						1,
						ScanErrorCategory.BUCKET_HASH
					)
				]
			)
		);
		jobMonitorMock.checkIn.mockResolvedValue(ok(undefined));

		await verifyArchives.execute({ persist: false, loop: false });

		const statuses = jobMonitorMock.checkIn.mock.calls.map(
			(call) => call[0].status
		);
		expect(statuses).toEqual(['in_progress', 'ok']);
	});

	it('should check in error when the scan was aborted before reaching the archive', async () => {
		//regression: an aborted scan checked in 'ok', so an archive that was never
		//verified was indistinguishable from a healthy one
		scanCoordinatorMock.getScanJob.mockResolvedValue(ok(mockScanJobDTO));
		scannerMock.perform.mockResolvedValue(
			new Scan(
				new Date(),
				new Date(),
				new Date(),
				Url.create('https://example.com')._unsafeUnwrap(),
				0,
				100,
				0,
				null,
				0,
				null,
				[
					new ScanError(
						ScanErrorType.TYPE_CONNECTION,
						'https://example.com',
						'Scan aborted: connection failed at ledger range 0-1000000',
						1,
						ScanErrorCategory.CONNECTION
					)
				]
			)
		);
		jobMonitorMock.checkIn.mockResolvedValue(ok(undefined));

		await verifyArchives.execute({ persist: false, loop: false });

		const statuses = jobMonitorMock.checkIn.mock.calls.map(
			(call) => call[0].status
		);
		expect(statuses).toEqual(['in_progress', 'error']);
		expect(statuses).not.toContain('ok');
	});

	it('should handle coordinator error and sleep', async () => {
		const error = new Error('Coordinator error');
		scanCoordinatorMock.getScanJob.mockResolvedValue(err(error));

		await verifyArchives.execute({ persist: false, loop: false });

		expect(exceptionLoggerMock.captureException).toHaveBeenCalledWith(error);
		expect(jobMonitorMock.checkIn).not.toHaveBeenCalled();
		expect(scannerMock.perform).not.toHaveBeenCalled();
	});

	it('should capture unexpected errors', async () => {
		const unexpectedError = new Error('Unexpected');
		scanCoordinatorMock.getScanJob.mockRejectedValue(unexpectedError);

		await verifyArchives.execute({ persist: false, loop: false });

		expect(exceptionLoggerMock.captureException).toHaveBeenCalled();
	});

	it('should respect persist flag', async () => {
		scanCoordinatorMock.getScanJob.mockResolvedValue(ok(mockScanJobDTO));
		jobMonitorMock.checkIn.mockResolvedValue(ok(undefined));
		scannerMock.perform.mockResolvedValue(
			new Scan(
				new Date(),
				new Date(),
				new Date(),
				Url.create('https://example.com')._unsafeUnwrap(),
				0,
				100
			)
		);

		await verifyArchives.execute({ persist: true, loop: false });

		expect(scanCoordinatorMock.registerScan).toHaveBeenCalled();
	});

	it('should handle persist errors', async () => {
		const error = new Error('Persist error');

		jobMonitorMock.checkIn.mockResolvedValue(ok(undefined));
		scanCoordinatorMock.getScanJob.mockResolvedValue(ok(mockScanJobDTO));
		scannerMock.perform.mockResolvedValue(
			new Scan(
				new Date(),
				new Date(),
				new Date(),
				Url.create('https://example.com')._unsafeUnwrap(),
				0,
				100
			)
		);
		scanCoordinatorMock.registerScan.mockRejectedValue(error);

		await verifyArchives.execute({ persist: true, loop: false });

		expect(exceptionLoggerMock.captureException).toHaveBeenCalledWith(error);
	});
});
