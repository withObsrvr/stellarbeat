export default {
	preset: 'ts-jest',
	testEnvironment: 'node',
	rootDir: './',
	testPathIgnorePatterns: ['/node_modules/', '/lib/'],
	transform: {
		'^.+\\.tsx?$': [
			'ts-jest',
			{
				tsconfig: 'tsconfig.json'
			}
		]
	}
};
