import { VerifyArchives } from '../../use-cases/verify-archives/VerifyArchives';
import Kernel from '../Kernel';

// noinspection JSIgnoredPromiseFromCall
main();

async function main() {
	const kernel = await Kernel.getInstance();
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
