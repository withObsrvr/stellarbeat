import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();

const databaseUrl = process.env.ACTIVE_DATABASE_URL;
const databaseSslEnabled = !databaseUrl
	?.toLowerCase()
	.includes('sslmode=disable');

// Debug logging for database connection
console.log(
	'Debug: DATABASE_URL:',
	process.env.ACTIVE_DATABASE_URL ? '[REDACTED]' : 'undefined'
);
console.log(
	'Debug: TYPEORM_MIGRATIONS_RUN:',
	process.env.TYPEORM_MIGRATIONS_RUN
);
console.log('Debug: NODE_ENV:', process.env.NODE_ENV);

const AppDataSource = new DataSource({
	type: 'postgres',
	logging: process.env.DEBUG === 'true',
	synchronize: false,
	url: databaseUrl,
	entities: ['lib/**/entities/*.js', 'lib/**/domain/**/!(*.test)*.js'],
	migrations: ['lib/**/migrations/*.js'],
	// Enable migrations since we're using the doadmin user
	migrationsRun: process.env.TYPEORM_MIGRATIONS_RUN !== 'false',
	ssl: databaseSslEnabled,
	// Managed databases use SSL without local CA verification; local URLs can
	// explicitly opt out with sslmode=disable.
	extra: databaseSslEnabled
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
