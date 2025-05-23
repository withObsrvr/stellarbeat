import 'reflect-metadata';
import { Container, decorate, injectable } from 'inversify';
import { DataSource, Repository } from 'typeorm';
import { Config, getConfigFromEnv } from '../config/Config';
import { load as loadHistory } from '../../history-scan-coordinator/infrastructure/di/container';
import { load as loadNetworkScan } from '../../network-scan/infrastructure/di/container';
import { load as loadNetworkEventNotifications } from '../../notifications/infrastructure/di/container';
import { load as loadCore } from '../infrastructure/di/container';
import { AppDataSource } from './database/AppDataSource';
import { TestingAppDataSource } from './database/TestingAppDataSource';

export default class Kernel {
	private static instance?: Kernel;
	protected _container?: Container;
	public config!: Config;

	private constructor() {
		try {
			decorate(injectable(), DataSource);
			decorate(injectable(), Repository);
			// eslint-disable-next-line no-empty
		} catch (e) {}
		//a second getInstance cannot redecorate the above classes
	}

	static async getInstance(config?: Config) {
		console.log('DEBUG: Kernel getInstance called');
		if (!Kernel.instance) {
			if (!config) {
				const configResult = getConfigFromEnv();
				if (configResult.isErr()) {
					throw configResult.error;
				}

				config = configResult.value;
			}
			Kernel.instance = new Kernel();
			Kernel.instance.config = config;
			console.log('DEBUG: Kernel instance created');
			await Kernel.instance.initializeContainer(config);
		}

		return Kernel.instance;
	}

	async close() {
		await this.container.get(DataSource).destroy();
		Kernel.instance = undefined;
	}

	private async initializeContainer(config: Config): Promise<void> {
		this._container = new Container();
		let isTest = false;
		if (config.nodeEnv === 'test') isTest = true;

		await this.loadDatabase(config, isTest);
		loadCore(this.container, config);
		loadNetworkScan(this.container, config);
		loadNetworkEventNotifications(this.container, config);
		loadHistory(this.container, config);
	}

	get container(): Container {
		if (this._container === undefined)
			throw new Error('Kernel not initialized');

		return this._container;
	}

	async shutdown() {
		await this.container.get(DataSource).destroy();
	}

	async loadDatabase(config: Config, isTest: boolean) {
		try {
			console.log("Initializing database connection...");
			
			// Add retries for database connection
			let retries = 5;
			let lastError;
			
			while (retries > 0) {
				try {
					// Try to initialize the database
					if (isTest) {
						await TestingAppDataSource.initialize();
					} else {
						await AppDataSource.initialize();
					}
					
					console.log("Database connection established successfully");
					
					// Bind the datasource to the container
					this.container
						.bind<DataSource>(DataSource)
						.toDynamicValue(() => {
							return isTest ? TestingAppDataSource : AppDataSource;
						})
						.inSingletonScope();
					
					// If we got here, we succeeded
					return;
				} catch (error) {
					lastError = error;
					console.error(`Database connection attempt failed (${retries} retries left):`, error);
					retries--;
					
					if (retries > 0) {
						// Wait for a few seconds before retrying
						console.log(`Waiting 5 seconds before retrying...`);
						await new Promise(resolve => setTimeout(resolve, 5000));
					}
				}
			}
			
			// If we got here, all retries failed
			console.error("All database connection attempts failed");
			throw lastError;
		} catch (error) {
			console.error("Failed to initialize database connection:", error);
			throw error;
		}
	}
}
