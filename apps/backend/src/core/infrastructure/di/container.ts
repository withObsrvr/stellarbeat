import { Config } from '../../config/Config';
import { interfaces } from 'inversify';
import Container = interfaces.Container;
import { Logger, PinoLogger } from 'logger';
import { HttpService } from 'http-helper';
import { AxiosHttpService } from 'http-helper';
import { HeartBeater } from '../../services/HeartBeater';
import { DeadManSnitchHeartBeater } from '../../../network-scan/infrastructure/services/DeadManSnitchHeartBeater';
import { DummyHeartBeater } from '../../../network-scan/infrastructure/services/DummyHeartBeater';
import { LoopTimer } from '../../services/LoopTimer';
import { JobMonitor } from 'job-monitor';
import { CORE_TYPES } from './di-types';
import { SentryJobMonitor, LoggerJobMonitor } from 'job-monitor';
import {
	ExceptionLogger,
	SentryExceptionLogger,
	ConsoleExceptionLogger
} from 'exception-logger';

export function load(container: Container, config: Config) {
	container
		.bind<Logger>('Logger')
		.toDynamicValue(() => {
			return new PinoLogger(config.logLevel);
		})
		.inSingletonScope();
	container
		.bind<HttpService>('HttpService')
		.toDynamicValue(() => {
			return new AxiosHttpService(config.userAgent);
		})
		.inSingletonScope();

	container.bind<HeartBeater>('HeartBeater').toDynamicValue(() => {
		if (config.enableDeadManSwitch && config.deadManSwitchUrl)
			return new DeadManSnitchHeartBeater(
				container.get<HttpService>('HttpService'),
				config.deadManSwitchUrl
			);
		return new DummyHeartBeater();
	});

	container.bind<JobMonitor>(CORE_TYPES.JobMonitor).toDynamicValue(() => {
		if (config.enableSentry && config.sentryDSN)
			return new SentryJobMonitor(config.sentryDSN);
		return new LoggerJobMonitor(container.get<Logger>('Logger'));
	});

	container.bind<ExceptionLogger>('ExceptionLogger').toDynamicValue(() => {
		if (config.enableSentry && config.sentryDSN)
			return new SentryExceptionLogger(
				config.sentryDSN,
				container.get<Logger>('Logger')
			);
		else return new ConsoleExceptionLogger();
	});

	container.bind(LoopTimer).toSelf();
}
