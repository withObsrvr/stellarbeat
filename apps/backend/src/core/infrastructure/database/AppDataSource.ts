import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();

const AppDataSource = new DataSource({
	type: 'postgres',
	logging: false,
	synchronize: false,
	url: process.env.ACTIVE_DATABASE_URL,
	entities: ['lib/**/entities/*.js', 'lib/**/domain/**/!(*.test)*.js'],
	migrations: ['lib/**/migrations/*.js'],
	migrationsRun: true,
	ssl: process.env.NODE_ENV !== 'development',
	extra:
		process.env.NODE_ENV !== 'development'
			? {
					ssl: {
						rejectUnauthorized: false
					}
			  }
			: undefined,
	poolSize: process.env.DATABASE_POOL_SIZE
		? parseInt(process.env.DATABASE_POOL_SIZE)
		: 10
});

export { AppDataSource };
