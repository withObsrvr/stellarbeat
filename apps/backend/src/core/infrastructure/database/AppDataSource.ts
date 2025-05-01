import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();

// Debug logging for database connection
console.log('Debug: DATABASE_URL:', process.env.ACTIVE_DATABASE_URL ? '[REDACTED]' : 'undefined');
console.log('Debug: TYPEORM_MIGRATIONS_RUN:', process.env.TYPEORM_MIGRATIONS_RUN);
console.log('Debug: NODE_ENV:', process.env.NODE_ENV);

const AppDataSource = new DataSource({
	type: 'postgres',
	logging: process.env.DEBUG === 'true',
	synchronize: false,
	url: process.env.ACTIVE_DATABASE_URL,
	entities: ['lib/**/entities/*.js', 'lib/**/domain/**/!(*.test)*.js'],
	migrations: ['lib/**/migrations/*.js'],
	// Enable migrations since we're using the doadmin user
	migrationsRun: process.env.TYPEORM_MIGRATIONS_RUN !== 'false',
	ssl: true,
	// Always disable SSL verification for DigitalOcean managed databases
	extra: {
		ssl: {
			rejectUnauthorized: false
		}
	},
	poolSize: process.env.DATABASE_POOL_SIZE
		? parseInt(process.env.DATABASE_POOL_SIZE)
		: 10
});

export { AppDataSource };
