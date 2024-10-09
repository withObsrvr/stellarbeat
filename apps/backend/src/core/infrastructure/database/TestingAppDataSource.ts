import { DataSource } from 'typeorm';
import * as path from 'path';

const TestingAppDataSource: DataSource = new DataSource({
	type: 'postgres',
	dropSchema: true,
	synchronize: true,
	logging: false,
	url: process.env.DATABASE_TEST_URL,
	entities: [
		path.resolve(__dirname, '../../../**/entities/*.ts'),
		path.resolve(__dirname, '../../../**/domain/**/!(*.test)*.ts')
	],
	migrationsRun: false,
	ssl: false
});

export { TestingAppDataSource };
