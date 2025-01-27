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
import { HistoryArchiveRepository } from '../../domain/HistoryArchiveRepository';
import { NetworkScanHistoryArchiveRepository } from '../repositories/NetworkScanHistoryArchiveRepository';
import { NetworkDTOService } from '../../../network-scan/services/NetworkDTOService';
import { GetScanJobs } from '../../use-cases/get-scan-jobs/GetScanJobs';
import {
	RestartAtLeastOneScan,
	ScanScheduler
} from '../../domain/ScanScheduler';

export function load(container: Container, config: Config) {
	const dataSource = container.get(DataSource);
	container.bind(GetLatestScan).toSelf();
	container.bind(GetScanJobs).toSelf();
	container.bind(RegisterScan).toSelf();
	container.bind<ScanScheduler>(TYPES.ScanScheduler).toDynamicValue(() => {
		return new RestartAtLeastOneScan();
	});
	container.bind(ScanMapper).toSelf();
	container
		.bind<HistoryArchiveRepository>(TYPES.HistoryArchiveRepository)
		.toDynamicValue(() => {
			const service = container.get(NetworkDTOService);
			return new NetworkScanHistoryArchiveRepository(service);
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
