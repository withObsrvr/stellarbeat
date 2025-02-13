import Kernel from '../../../../../core/infrastructure/Kernel';
import { ConfigMock } from '../../../../../core/config/__mocks__/configMock';
import { TypeOrmScanJobRepository } from '../TypeOrmScanJobRepository';
import { ScanJob } from '../../../../domain/ScanJob';
import { TYPES } from '../../../di/di-types';
import { v4 } from 'uuid';

describe('TypeOrmScanJobRepository.integration', () => {
	let kernel: Kernel;
	let typeOrmScanJobRepository: TypeOrmScanJobRepository;

	beforeEach(async () => {
		kernel = await Kernel.getInstance(new ConfigMock());
		typeOrmScanJobRepository = kernel.container.get<TypeOrmScanJobRepository>(
			TYPES.ScanJobRepository
		);
	});

	afterEach(async () => {
		await kernel.close();
	});

	it('should load the repository without errors', async () => {
		expect(typeOrmScanJobRepository).toBeDefined();
	});

	describe('fetchNextJob', () => {
		it('should return null for fetchNextJob when no jobs exist', async () => {
			const nextJob = await typeOrmScanJobRepository.fetchNextJob();
			expect(nextJob).toBeNull();
		});

		it('should return a job for fetchNextJob when a job exists', async () => {
			const scanJob = new ScanJob('test');
			await typeOrmScanJobRepository.save([scanJob]);
			const nextJob = await typeOrmScanJobRepository.fetchNextJob();
			expect(nextJob).toBeDefined();
			expect(nextJob?.url).toBe('test');
		});

		it('should return the fifo job for fetchNextJob when multiple jobs exist', async () => {
			const scanJob = new ScanJob('test1');
			const scanJob2 = new ScanJob('test2');
			await typeOrmScanJobRepository.save([scanJob, scanJob2]);
			const nextJob = await typeOrmScanJobRepository.fetchNextJob();
			expect(nextJob).toBeDefined();
			expect(nextJob?.url).toBe('test1');
		});
	});

	describe('hasPendingJobs', () => {
		it('should indicate false on hasPendingJobs with no existing jobs', async () => {
			const hasPending = await typeOrmScanJobRepository.hasPendingJobs();
			expect(hasPending).toBe(false);
		});

		it('should indicate true on hasPendingJobs with existing jobs', async () => {
			const scanJob = new ScanJob('test');
			await typeOrmScanJobRepository.save([scanJob]);
			const hasPending = await typeOrmScanJobRepository.hasPendingJobs();
			expect(hasPending).toBe(true);
		});
	});

	describe('findByRemoteId', () => {
		it('should return null if no job with matching remoteId exists', async () => {
			const uuid = v4();
			const job = await typeOrmScanJobRepository.findByRemoteId(uuid);
			expect(job).toBeNull();
		});

		it('should return the job if found by remoteId', async () => {
			const scanJob = new ScanJob('test-url');
			await typeOrmScanJobRepository.save([scanJob]);

			const threeDaysAgo = new Date();
			threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

			const jobs =
				await typeOrmScanJobRepository.findUnfinishedJobs(threeDaysAgo);
			if (jobs.length !== 1) {
				throw new Error('Expected one job to be found');
			}

			const job = await typeOrmScanJobRepository.findByRemoteId(
				jobs[0].remoteId
			);
			expect(job).toBeDefined();
			expect(job?.url).toBe('test-url');
		});
	});

	describe('findUnfinishedJobs', () => {
		it('should find unfinished jobs after the given date', async () => {
			const scanJob = new ScanJob('test-url');
			const finishedJob = new ScanJob('test-url2');
			finishedJob.status = 'DONE';

			await typeOrmScanJobRepository.save([scanJob, finishedJob]);

			const threeDaysAgo = new Date();
			threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

			const jobs =
				await typeOrmScanJobRepository.findUnfinishedJobs(threeDaysAgo);
			expect(jobs).toHaveLength(1);
			expect(jobs[0].url).toBe('test-url');

			const noJobs = await typeOrmScanJobRepository.findUnfinishedJobs(
				new Date()
			);
			expect(noJobs).toHaveLength(0);
		});
	});
});
