module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	transform: {
		'^.+\\.tsx?$': 'ts-jest'
	},
	globals: {
		'ts-jest': {
			tsconfig: 'tsconfig.json'
		}
	},
	projects: [
		{
			testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/lib'],
			preset: 'ts-jest',
			displayName: 'backend',
			rootDir: 'apps/backend',
			moduleDirectories: ['node_modules']
		},
		{
			testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/lib'],
			preset: 'ts-jest',
			displayName: 'history-scanner',
			rootDir: 'apps/history-scanner'
		},
		{
			testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/lib'],
			preset: 'ts-jest',
			displayName: 'crawler',
			rootDir: 'packages/crawler'
		},
		{
			testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/lib'],
			preset: 'ts-jest',
			displayName: 'shared',
			rootDir: 'packages/shared'
		},
		{
			testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/lib'],
			preset: 'ts-jest',
			displayName: 'scp-simulation',
			rootDir: 'packages/scp-simulation'
		},
		{
			testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/lib'],
			preset: 'ts-jest',
			displayName: 'http-helper',
			rootDir: 'packages/http-helper'
		},
		{
			testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/lib'],
			preset: 'ts-jest',
			displayName: 'logger',
			rootDir: 'packages/logger'
		},
		{
			testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/lib'],
			preset: 'ts-jest',
			displayName: 'job-monitor',
			rootDir: 'packages/job-monitor'
		},
		{
			testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/lib'],
			preset: 'ts-jest',
			displayName: 'exception-logger',
			rootDir: 'packages/exception-logger'
		},
		{
			testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/lib'],
			preset: 'ts-jest',
			displayName: 'node-connector',
			rootDir: 'packages/node-connector'
		},
		{
			moduleFileExtensions: ['js', 'jsx', 'json', 'vue', 'ts', 'tsx'],
			preset: 'ts-jest',
			displayName: 'frontend',
			rootDir: 'apps/frontend',
			moduleNameMapper: {
				'^@/(.*)$': '<rootDir>/src/$1'
			},
			testMatch: ['**/__tests__/**/*.test.(js|jsx|ts|tsx)'],
			testEnvironmentOptions: {
				url: 'http://localhost/'
			}
		}
	]
};
