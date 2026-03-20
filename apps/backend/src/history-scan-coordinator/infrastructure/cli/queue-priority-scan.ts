import 'reflect-metadata';

import Kernel from '../../../core/infrastructure/Kernel';
import { ScanJobRepository } from '../../domain/ScanJobRepository';
import { ScanJob } from '../../domain/ScanJob';
import { TYPES } from '../di/di-types';

const DEFAULT_PRIORITY = 10;

run();

async function run() {
	const url = process.argv[2];

	if (!url) {
		console.error('Usage: pnpm priority-scan <history-archive-url>');
		console.error('Example: pnpm priority-scan https://stellar-history-3.script3.io');
		process.exit(1);
	}

	try {
		new URL(url);
	} catch {
		console.error(`Invalid URL: ${url}`);
		process.exit(1);
	}

	const kernel = await Kernel.getInstance();

	try {
		const scanJobRepository = kernel.container.get<ScanJobRepository>(
			TYPES.ScanJobRepository
		);

		const scanJob = ScanJob.createPriorityJob(url, DEFAULT_PRIORITY);
		await scanJobRepository.save([scanJob]);

		console.log(`Priority scan job queued successfully:`);
		console.log(`  URL: ${url}`);
		console.log(`  Priority: ${DEFAULT_PRIORITY}`);
		console.log(`  Remote ID: ${scanJob.remoteId}`);
	} catch (error) {
		if (error instanceof Error) {
			console.error(`Failed to queue priority scan: ${error.message}`);
		} else {
			console.error('Failed to queue priority scan');
		}
		process.exit(1);
	} finally {
		await kernel.shutdown();
	}
}
