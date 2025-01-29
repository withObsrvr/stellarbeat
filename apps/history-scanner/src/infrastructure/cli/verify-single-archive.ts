import { VerifySingleArchive } from '../../use-cases/verify-single-archive/VerifySingleArchive';
import Kernel from '../Kernel';

// noinspection JSIgnoredPromiseFromCall
main();

async function main() {
	const kernel = await Kernel.getInstance();
	const verifySingleArchive = kernel.container.get(VerifySingleArchive);
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

	const historyUrl = process.argv[2];

	let fromLedger: number | undefined = undefined;
	if (!isNaN(Number(process.argv[3]))) {
		fromLedger = Number(process.argv[3]);
	}

	let toLedger: number | undefined = undefined;
	if (!isNaN(Number(process.argv[4]))) {
		toLedger = Number(process.argv[4]);
	}

	let concurrency: number | undefined = undefined;
	if (!isNaN(Number(process.argv[5]))) {
		concurrency = Number(process.argv[5]);
	}

	const result = await verifySingleArchive.execute({
		toLedger: toLedger,
		fromLedger: fromLedger,
		maxConcurrency: concurrency,
		historyUrl: historyUrl
	});

	if (result.isErr()) {
		console.log(result.error);
	}
}
