import { Scanner } from '../../domain/scanner/Scanner';
import { interfaces } from 'inversify';
import Container = interfaces.Container;
import { HASValidator } from '../../domain/history-archive/HASValidator';
import { CheckPointGenerator } from '../../domain/check-point/CheckPointGenerator';
import { CheckPointFrequency } from '../../domain/check-point/CheckPointFrequency';
import { TYPES } from './di-types';
import { StandardCheckPointFrequency } from '../../domain/check-point/StandardCheckPointFrequency';
import { CategoryScanner } from '../../domain/scanner/CategoryScanner';
import { BucketScanner } from '../../domain/scanner/BucketScanner';
import { RangeScanner } from '../../domain/scanner/RangeScanner';
import { VerifyArchives } from '../../use-cases/verify-archives/VerifyArchives';
import { ArchivePerformanceTester } from '../../domain/scanner/ArchivePerformanceTester';
import { ScanSettingsFactory } from '../../domain/scan/ScanSettingsFactory';
import { CategoryVerificationService } from '../../domain/scanner/CategoryVerificationService';
import { Config } from '../config/Config';
import { AxiosHttpService, HttpQueue, HttpService } from 'http-helper';
import { ScanCoordinatorService } from '../../domain/scan/ScanCoordinatorService';
import { RESTScanCoordinatorService } from '../services/RESTScanCoordinatorService';
import { JobMonitor, LoggerJobMonitor, SentryJobMonitor } from 'job-monitor';
import {
	ConsoleExceptionLogger,
	ExceptionLogger,
	SentryExceptionLogger
} from 'exception-logger';
import { Logger, PinoLogger } from 'logger';
import { VerifySingleArchive } from '../../use-cases/verify-single-archive/VerifySingleArchive';

export function load(container: Container, config: Config) {
	container.bind(CategoryScanner).toSelf();
	container.bind(BucketScanner).toSelf();
	container.bind(HASValidator).toSelf();
	container.bind(Scanner).toSelf();
	container.bind(RangeScanner).toSelf();
	container.bind(VerifyArchives).toSelf();
	container.bind(VerifySingleArchive).toSelf();
	container.bind(CheckPointGenerator).toSelf();
	container.bind(CategoryVerificationService).toSelf();
	container.bind(ScanSettingsFactory).toDynamicValue(() => {
		return new ScanSettingsFactory(
			container.get(CategoryScanner),
			container.get(ArchivePerformanceTester),
			config.historySlowArchiveMaxLedgers
		);
	});
	container
		.bind(ArchivePerformanceTester)
		.toDynamicValue(
			() =>
				new ArchivePerformanceTester(
					container.get(CheckPointGenerator),
					container.get<HttpQueue>(TYPES.HttpQueue),
					config.historyMaxFileMs
				)
		);
	container
		.bind<CheckPointFrequency>(TYPES.CheckPointFrequency)
		.toDynamicValue(() => {
			return new StandardCheckPointFrequency();
		});
	container
		.bind<ScanCoordinatorService>(TYPES.ScanCoordinatorService)
		.toDynamicValue(() => {
			return new RESTScanCoordinatorService(
				container.get<HttpService>(TYPES.HttpService),
				config.coordinatorAPIBaseUrl,
				config.coordinatorAPIUsername,
				config.coordinatorAPIPassword
			);
		});
	container.bind<ExceptionLogger>(TYPES.ExceptionLogger).toDynamicValue(() => {
		if (config.enableSentry && config.sentryDSN)
			return new SentryExceptionLogger(
				config.sentryDSN,
				container.get<Logger>('Logger')
			);
		else return new ConsoleExceptionLogger();
	});
	container
		.bind<Logger>('Logger')
		.toDynamicValue(() => {
			return new PinoLogger(config.logLevel);
		})
		.inSingletonScope();
	container.bind<JobMonitor>(TYPES.JobMonitor).toDynamicValue(() => {
		if (config.enableSentry && config.sentryDSN)
			return new SentryJobMonitor(config.sentryDSN);
		return new LoggerJobMonitor(container.get<Logger>('Logger'));
	});
	container.bind<HttpService>(TYPES.HttpService).toDynamicValue(() => {
		return new AxiosHttpService(config.userAgent);
	});

	container.bind<HttpQueue>(TYPES.HttpQueue).toDynamicValue(() => {
		return new HttpQueue(
			container.get<HttpService>(TYPES.HttpService),
			container.get<Logger>('Logger')
		);
	});
}
