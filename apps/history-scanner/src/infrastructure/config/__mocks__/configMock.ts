import { Config } from '../Config';

export class ConfigMock implements Config {
	nodeEnv = 'test';
	enableSentry = false;
	sentryDSN = 'test-dsn';
	environment = 'test';
	userAgent = 'stellarbeat-history-scanner-test';
	backendAPIBaseUrl = 'http://localhost:3000';
	backendAPIUsername = 'test-user';
	backendAPIPassword = 'test-password';
	logLevel = 'debug';
	historyMaxFileMs = 60000;
	historySlowArchiveMaxLedgers = 1000;
}
