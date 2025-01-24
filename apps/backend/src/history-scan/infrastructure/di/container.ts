import { interfaces } from 'inversify';
import Container = interfaces.Container;
import { DataSource } from 'typeorm';
import { ScanRepository } from '../../domain/scan/ScanRepository';
import { TypeOrmHistoryArchiveScanResultRepository } from '../database/TypeOrmHistoryArchiveScanResultRepository';
import { TYPES } from './di-types';
import { Config } from '../../../core/config/Config';
import { GetLatestScan } from '../../use-cases/get-latest-scan/GetLatestScan';
import { Scan } from '../../domain/scan/Scan';
import { RegisterScan } from '../../use-cases/register-scan/RegisterScan';
import { ScanMapper } from '../mappers/ScanMapper';

export function load(container: Container, config: Config) {
	const dataSource = container.get(DataSource);
	container.bind(GetLatestScan).toSelf();
	container.bind(RegisterScan).toSelf();
	container.bind(ScanMapper).toSelf();
	container
		.bind<ScanRepository>(TYPES.HistoryArchiveScanRepository)
		.toDynamicValue(() => {
			return new TypeOrmHistoryArchiveScanResultRepository(
				dataSource.getRepository(Scan)
			);
		})
		.inRequestScope();
}
