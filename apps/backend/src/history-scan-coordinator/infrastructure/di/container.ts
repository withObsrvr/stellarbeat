import { interfaces } from 'inversify';
import Container = interfaces.Container;
import { DataSource } from 'typeorm';
import { ScanRepository } from '../../domain/scan/ScanRepository';
import { TypeOrmHistoryArchiveScanResultRepository } from '../repositories/database/TypeOrmHistoryArchiveScanResultRepository';
import { TYPES } from './di-types';
import { Config } from '../../../core/config/Config';
import { GetLatestScan } from '../../use-cases/get-latest-scan/GetLatestScan';
import { Scan } from '../../domain/scan/Scan';
import { RegisterScan } from '../../use-cases/register-scan/RegisterScan';
import { ScanMapper } from '../mappers/ScanMapper';
import { GetScanJob } from '../../use-cases/get-scan-job/GetScanJob';
import {
	RestartAtLeastOneScan,
	ScanScheduler
} from '../../domain/ScanScheduler';
import { ScheduleScanJobs } from '../../use-cases/schedule-scan-jobs/ScheduleScanJobs';
import { ScanJobRepository } from '../../domain/ScanJobRepository';
import { TypeOrmScanJobRepository } from '../repositories/database/TypeOrmScanJobRepository';
import { ScanJob } from '../../domain/ScanJob';

export function load(container: Container, config: Config) {
	const dataSource = container.get(DataSource);
	container.bind(GetLatestScan).toSelf();
	container.bind(GetScanJob).toSelf();
	container.bind(RegisterScan).toSelf();
	container.bind(ScheduleScanJobs).toSelf();
	container.bind<ScanScheduler>(TYPES.ScanScheduler).toDynamicValue(() => {
		return new RestartAtLeastOneScan();
	});
	container.bind(ScanMapper).toSelf();
	container
		.bind<ScanJobRepository>(TYPES.ScanJobRepository)
		.toDynamicValue(() => {
			return new TypeOrmScanJobRepository(dataSource.getRepository(ScanJob));
		})
		.inRequestScope();

	container
		.bind<ScanRepository>(TYPES.HistoryArchiveScanRepository)
		.toDynamicValue(() => {
			return new TypeOrmHistoryArchiveScanResultRepository(
				dataSource.getRepository(Scan)
			);
		})
		.inRequestScope();
}
