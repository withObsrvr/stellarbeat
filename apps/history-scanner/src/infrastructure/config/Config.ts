import { config } from 'dotenv';
import { err, ok, Result } from 'neverthrow';
import yn from 'yn';
import path from 'path';

config({
	path: path.resolve(__dirname + '../../../../.env')
});

export interface Config {
	nodeEnv: string;
	enableSentry: boolean;
	sentryDSN?: string;
	userAgent: string;
	coordinatorAPIBaseUrl: string;
	coordinatorAPIPassword: string;
	coordinatorAPIUsername: string;
	logLevel: string;
	historyMaxFileMs: number;
	historySlowArchiveMaxLedgers: number;
}

// Default values
const defaultConfig = {
	nodeEnv: 'development',
	enableSentry: false,
	userAgent: 'stellarbeat-history-scanner',
	logLevel: 'info',
	historyMaxFileMs: 60000,
	historySlowArchiveMaxLedgers: 1000
};

export function getConfigFromEnv(): Result<Config, Error> {
	// Required env vars validation
	const required = [
		'COORDINATOR_API_BASE_URL',
		'COORDINATOR_API_USERNAME',
		'COORDINATOR_API_PASSWORD'
	];

	const missing = required.filter((key) => !process.env[key]);
	if (missing.length) {
		return err(new Error(`Missing required env vars: ${missing.join(', ')}`));
	}

	// Optional vars with validation
	const enableSentry =
		yn(process.env.ENABLE_SENTRY) ?? defaultConfig.enableSentry;
	if (enableSentry && !process.env.SENTRY_DSN) {
		return err(new Error('SENTRY_DSN required when ENABLE_SENTRY is true'));
	}

	const historyMaxFileMs = process.env.HISTORY_MAX_FILE_MS
		? Number(process.env.HISTORY_MAX_FILE_MS)
		: defaultConfig.historyMaxFileMs;

	if (isNaN(historyMaxFileMs)) {
		return err(new Error('HISTORY_MAX_FILE_MS must be a number'));
	}

	const historySlowArchiveMaxLedgers = process.env
		.HISTORY_SLOW_ARCHIVE_MAX_LEDGERS
		? Number(process.env.HISTORY_SLOW_ARCHIVE_MAX_LEDGERS)
		: defaultConfig.historySlowArchiveMaxLedgers;

	if (isNaN(historySlowArchiveMaxLedgers)) {
		return err(new Error('HISTORY_SLOW_ARCHIVE_MAX_LEDGERS must be a number'));
	}

	return ok({
		nodeEnv: process.env.NODE_ENV ?? defaultConfig.nodeEnv,
		enableSentry,
		sentryDSN: enableSentry ? process.env.SENTRY_DSN : undefined,
		userAgent: process.env.USER_AGENT ?? defaultConfig.userAgent,
		coordinatorAPIBaseUrl: process.env.COORDINATOR_API_BASE_URL!,
		coordinatorAPIPassword: process.env.COORDINATOR_API_PASSWORD!,
		coordinatorAPIUsername: process.env.COORDINATOR_API_USERNAME!,
		logLevel: process.env.LOG_LEVEL ?? defaultConfig.logLevel,
		historyMaxFileMs,
		historySlowArchiveMaxLedgers
	});
}
