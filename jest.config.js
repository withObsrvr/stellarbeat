export default {
	preset: 'ts-jest',
	testEnvironment: 'node',
	rootDir: './',
	testPathIgnorePatterns: ['/node_modules/', '/lib/', '.integration.'],	
	transform: {
		'^.+\\.tsx?$': [
			'ts-jest',
			{
				tsconfig: 'tsconfig.json'
			}
		]
	}
};
