import { Config } from '../Config';

export class ConfigMock implements Config {
	nodeEnv = 'test';
	enableSentry = false;
	sentryDSN = 'test-dsn';
	environment = 'test';
	userAgent = 'stellarbeat-history-scanner-test';
	logLevel = 'debug';
	historyMaxFileMs = 60000;
	historySlowArchiveMaxLedgers = 1000;
	coordinatorAPIBaseUrl = 'http://127.0.0.1:3000';
	coordinatorAPIPassword = 'test-password';
	coordinatorAPIUsername = 'test-user';
}
