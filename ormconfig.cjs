module.exports = [
	{
		type: 'postgres',
		synchronize: false,
		logging: process.env.NODE_ENV === 'development',
		url: process.env.DATABASE_URL,
		entities: ['lib/User.js'],
		migrations: ['lib/migrations/*.js'],
		migrationsRun: true,
		ssl: true,
		extra: {
			ssl: {
				rejectUnauthorized: false
			}
		}
	}
];
