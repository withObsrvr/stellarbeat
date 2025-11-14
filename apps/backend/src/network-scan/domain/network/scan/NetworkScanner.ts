import { err, ok, Result } from 'neverthrow';
import NetworkScan from './NetworkScan';
import { inject, injectable } from 'inversify';
import { Logger } from '../../../../core/services/Logger';
import { NodeScan } from '../../node/scan/NodeScan';
import { OrganizationScan } from '../../organization/scan/OrganizationScan';
import { TrustGraphFactory } from '../../node/scan/TrustGraphFactory';
import FbasAnalyzerService from './fbas-analysis/FbasAnalyzerService';
import { NodesInTransitiveNetworkQuorumSetFinder } from './NodesInTransitiveNetworkQuorumSetFinder';
import { NetworkQuorumSetConfiguration } from '../NetworkQuorumSetConfiguration';
import { Snapshot } from '../../../../core/domain/Snapshot';
import { PythonFbasAdapter } from './python-fbas/PythonFbasAdapter';
import { Config } from '../../../../core/config/Config';

@injectable()
export class NetworkScanner {
	constructor(
		private fbasAnalyzer: FbasAnalyzerService,
		private pythonFbasAdapter: PythonFbasAdapter,
		private nodesInTransitiveNetworkQuorumSetFinder: NodesInTransitiveNetworkQuorumSetFinder,
		@inject('Config') private config: Config,
		@inject('Logger')
		private logger: Logger
	) {}

	async execute(
		networkScan: NetworkScan,
		nodeScan: NodeScan,
		organizationScan: OrganizationScan,
		networkQuorumSetConfiguration: NetworkQuorumSetConfiguration
	): Promise<Result<NetworkScan, Error>> {
		networkScan.processNodeScan(nodeScan);

		const analysisResultOrError = await this.analyzeFBAS(
			nodeScan,
			organizationScan,
			networkQuorumSetConfiguration
		);

		if (analysisResultOrError.isErr()) {
			return err(analysisResultOrError.error);
		}

		networkScan.addMeasurement(
			analysisResultOrError.value,
			nodeScan,
			organizationScan,
			TrustGraphFactory.create(nodeScan.nodes)
		);

		networkScan.completed = true;

		return ok(networkScan);
	}

	private async analyzeFBAS(
		nodeScan: NodeScan,
		organizationScan: OrganizationScan,
		networkQuorumSetConfiguration: NetworkQuorumSetConfiguration
	) {
		const nodesToAnalyze = this.nodesInTransitiveNetworkQuorumSetFinder.find(
			nodeScan.nodes,
			networkQuorumSetConfiguration
		);

		const organizationsToAnalyze = organizationScan.organizations.filter(
			(organization) => {
				// Filter out organizations with no validators
				if (organization.validators.value.length === 0) {
					return false;
				}

				// Filter out archived organizations
				// Archived organizations have endDate < Snapshot.MAX_DATE
				if (
					organization.snapshotEndDate.getTime() < Snapshot.MAX_DATE.getTime()
				) {
					return false;
				}

				return true;
			}
		);

		this.logger.info('Analyzing FBAS', {
			nrOfNodes: nodesToAnalyze.length,
			nodes: nodesToAnalyze.map((n) => n.details?.name ?? n.publicKey.value),
			organizations: organizationsToAnalyze.map(
				(n) => n.name ?? n.organizationId.value
			),
			usingPythonScanner: this.config.enablePythonFbas
		});

		// Use Python scanner if enabled
		if (this.config.enablePythonFbas) {
			this.logger.info('Using Python FBAS scanner (removes tier 1 org cap)');

			const pythonResult = await this.pythonFbasAdapter.analyze(
				nodesToAnalyze,
				organizationsToAnalyze
			);

			if (pythonResult.isOk()) {
				this.logger.info('Python FBAS analysis succeeded');
				return pythonResult;
			}

			// Fall back to Rust scanner on Python scanner failure
			this.logger.warn('Python FBAS analysis failed, falling back to Rust scanner', {
				error: pythonResult.error.message
			});
		}

		// Use Rust scanner (default or fallback)
		this.logger.info('Using Rust FBAS scanner');
		return this.fbasAnalyzer.performAnalysis(
			nodesToAnalyze,
			organizationsToAnalyze
		);
	}
}
