import 'reflect-metadata';
import { Container, decorate, injectable } from 'inversify';
import { Config, getConfigFromEnv } from './config/Config';
import { load } from './di/container';

export default class Kernel {
	private static instance?: Kernel;
	protected _container?: Container;
	public config!: Config;

	static async getInstance(config?: Config) {
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
			await Kernel.instance.initializeContainer(config);
		}

		return Kernel.instance;
	}

	async close() {
		Kernel.instance = undefined;
	}

	private async initializeContainer(config: Config): Promise<void> {
		this._container = new Container();
		let isTest = false;
		if (config.nodeEnv === 'test') isTest = true;

		load(this.container, config);
	}

	get container(): Container {
		if (this._container === undefined)
			throw new Error('Kernel not initialized');

		return this._container;
	}

	async shutdown() {}
}
