import Kernel from '../../../../../core/infrastructure/Kernel';
import { ConfigMock } from '../../../../../core/config/__mocks__/configMock';
import { DataSource } from 'typeorm';
import { TypeOrmScanJobRepository } from '../TypeOrmScanJobRepository';
import { ScanJob } from '../../../../domain/ScanJob';
import { TYPES } from '../../../di/di-types';

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
});
