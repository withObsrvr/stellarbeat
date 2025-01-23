import * as Sentry from '@sentry/node';
import { ExceptionLogger } from './ExceptionLogger';

export type logFn = (
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

export class SentryExceptionLogger implements ExceptionLogger {
	constructor(
		sentryDSN: string,
		protected logger: Logger
	) {
		Sentry.init({
			dsn: sentryDSN
		});
	}

	captureException(error: Error, extra?: Record<string, unknown>): void {
		this.logger.error(error.message, extra);
		Sentry.captureException(error, extra ? { extra: extra } : undefined);
	}
}
