// Must come first: sizes the libuv thread pool before anything touches it.
import '../uv-thread-pool';
import 'reflect-metadata';
import { VerifyArchives } from '../../use-cases/verify-archives/VerifyArchives';
import Kernel from '../Kernel';
import { Logger } from 'logger';

// noinspection JSIgnoredPromiseFromCall
main();

async function main() {
	const kernel = await Kernel.getInstance();
	kernel.container.get<Logger>('Logger').info('Scanner runtime tuning', {
		uvThreadPoolSize: kernel.config.uvThreadPoolSize,
		maxConcurrency: kernel.config.maxConcurrency
	});
	const verifyArchives = kernel.container.get(VerifyArchives);
	//handle shutdown
	process
		.on('SIGTERM', async () => {
			await kernel.shutdown();
			process.exit(0);
		})
		.on('SIGINT', async () => {
			await kernel.shutdown();
			process.exit(0);
		});

	let persist = false;
	if (process.argv[2] === '1') {
		persist = true;
	}

	let loop = true;
	if (process.argv[3] === '0') {
		loop = false;
	}

	await verifyArchives.execute({
		persist: persist,
		loop: loop
	});
}
