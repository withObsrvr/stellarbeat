import { NetworkScanner } from '../NetworkScanner';
import { mock } from 'jest-mock-extended';
import { Logger } from 'logger';
import { NodeScan } from '../../../node/scan/NodeScan';
import FbasAnalyzerService from '../fbas-analysis/FbasAnalyzerService';
import NetworkScan from '../NetworkScan';
import { OrganizationScan } from '../../../organization/scan/OrganizationScan';
import { err, ok } from 'neverthrow';
import { AnalysisResult } from '../fbas-analysis/AnalysisResult';
import { NodesInTransitiveNetworkQuorumSetFinder } from '../NodesInTransitiveNetworkQuorumSetFinder';
import { createDummyNetworkQuorumSetConfiguration } from '../../__fixtures__/createDummyNetworkQuorumSetConfiguration';
import { PythonFbasAdapter } from '../python-fbas/PythonFbasAdapter';
import { Config } from '../../../../../core/config/Config';

describe('NetworkScanner', () => {
	it('should perform a network scan', async function () {
		const {
			networkScan,
			analyzer,
			nodesInTransitiveNetworkQuorumSetFinder,
			networkScanner
		} = setupSUT();

		nodesInTransitiveNetworkQuorumSetFinder.find.mockReturnValue([]);
		analyzer.performAnalysis.mockReturnValue(ok(mock<AnalysisResult>()));

		const nodeScan = new NodeScan(new Date(), []);
		const organizationScan = new OrganizationScan(new Date(), []);

		const result = await networkScanner.execute(
			networkScan,
			nodeScan,
			organizationScan,
			createDummyNetworkQuorumSetConfiguration()
		);
		expect(result.isOk()).toBeTruthy();

		expect(analyzer.performAnalysis).toBeCalled();
		expect(nodesInTransitiveNetworkQuorumSetFinder.find).toBeCalledTimes(1);
		expect(networkScan.addMeasurement).toBeCalled();
		expect(networkScan.completed).toBeTruthy();
	});

	it('should return an error if the analysis fails', async function () {
		const {
			networkScan,
			analyzer,
			nodesInTransitiveNetworkQuorumSetFinder,
			networkScanner
		} = setupSUT();

		nodesInTransitiveNetworkQuorumSetFinder.find.mockReturnValue([]);
		analyzer.performAnalysis.mockReturnValue(err(new Error('test')));

		const nodeScan = new NodeScan(new Date(), []);
		const organizationScan = new OrganizationScan(new Date(), []);
		const result = await networkScanner.execute(
			networkScan,
			nodeScan,
			organizationScan,
			createDummyNetworkQuorumSetConfiguration()
		);
		expect(result.isOk()).toBeFalsy();

		expect(analyzer.performAnalysis).toBeCalled();
	});

	describe('Python FBAS Integration', () => {
		it('should use Python scanner when enabled and successful', async function () {
			const {
				networkScan,
				analyzer,
				pythonFbasAdapter,
				nodesInTransitiveNetworkQuorumSetFinder,
				logger,
				networkScanner
			} = setupSUT(true); // Python FBAS enabled

			nodesInTransitiveNetworkQuorumSetFinder.find.mockReturnValue([]);
			const pythonResult = ok(mock<AnalysisResult>());
			pythonFbasAdapter.analyze.mockResolvedValue(pythonResult);

			const nodeScan = new NodeScan(new Date(), []);
			const organizationScan = new OrganizationScan(new Date(), []);

			const result = await networkScanner.execute(
				networkScan,
				nodeScan,
				organizationScan,
				createDummyNetworkQuorumSetConfiguration()
			);

			expect(result.isOk()).toBeTruthy();
			expect(pythonFbasAdapter.analyze).toHaveBeenCalled();
			expect(analyzer.performAnalysis).not.toHaveBeenCalled();
			expect(logger.info).toHaveBeenCalledWith(
				'Using Python FBAS scanner (removes tier 1 org cap)'
			);
			expect(logger.info).toHaveBeenCalledWith(
				'Python FBAS analysis succeeded'
			);
		});

		it('should fallback to Rust scanner when Python scanner fails', async function () {
			const {
				networkScan,
				analyzer,
				pythonFbasAdapter,
				nodesInTransitiveNetworkQuorumSetFinder,
				logger,
				networkScanner
			} = setupSUT(true); // Python FBAS enabled

			nodesInTransitiveNetworkQuorumSetFinder.find.mockReturnValue([]);
			const pythonError = err(new Error('Python service unavailable'));
			pythonFbasAdapter.analyze.mockResolvedValue(pythonError);
			const rustResult = ok(mock<AnalysisResult>());
			analyzer.performAnalysis.mockReturnValue(rustResult);

			const nodeScan = new NodeScan(new Date(), []);
			const organizationScan = new OrganizationScan(new Date(), []);

			const result = await networkScanner.execute(
				networkScan,
				nodeScan,
				organizationScan,
				createDummyNetworkQuorumSetConfiguration()
			);

			expect(result.isOk()).toBeTruthy();
			expect(pythonFbasAdapter.analyze).toHaveBeenCalled();
			expect(analyzer.performAnalysis).toHaveBeenCalled();
			expect(logger.warn).toHaveBeenCalledWith(
				'Python FBAS analysis failed, falling back to Rust scanner',
				{ error: 'Python service unavailable' }
			);
			expect(logger.info).toHaveBeenCalledWith('Using Rust FBAS scanner');
		});

		it('should use Rust scanner when Python scanner is disabled', async function () {
			const {
				networkScan,
				analyzer,
				pythonFbasAdapter,
				nodesInTransitiveNetworkQuorumSetFinder,
				logger,
				networkScanner
			} = setupSUT(false); // Python FBAS disabled

			nodesInTransitiveNetworkQuorumSetFinder.find.mockReturnValue([]);
			const rustResult = ok(mock<AnalysisResult>());
			analyzer.performAnalysis.mockReturnValue(rustResult);

			const nodeScan = new NodeScan(new Date(), []);
			const organizationScan = new OrganizationScan(new Date(), []);

			const result = await networkScanner.execute(
				networkScan,
				nodeScan,
				organizationScan,
				createDummyNetworkQuorumSetConfiguration()
			);

			expect(result.isOk()).toBeTruthy();
			expect(pythonFbasAdapter.analyze).not.toHaveBeenCalled();
			expect(analyzer.performAnalysis).toHaveBeenCalled();
			expect(logger.info).toHaveBeenCalledWith('Using Rust FBAS scanner');
		});

		it('should return error when both Python and Rust scanners fail', async function () {
			const {
				networkScan,
				analyzer,
				pythonFbasAdapter,
				nodesInTransitiveNetworkQuorumSetFinder,
				networkScanner
			} = setupSUT(true); // Python FBAS enabled

			nodesInTransitiveNetworkQuorumSetFinder.find.mockReturnValue([]);
			const pythonError = err(new Error('Python service unavailable'));
			pythonFbasAdapter.analyze.mockResolvedValue(pythonError);
			const rustError = err(new Error('Rust analysis failed'));
			analyzer.performAnalysis.mockReturnValue(rustError);

			const nodeScan = new NodeScan(new Date(), []);
			const organizationScan = new OrganizationScan(new Date(), []);

			const result = await networkScanner.execute(
				networkScan,
				nodeScan,
				organizationScan,
				createDummyNetworkQuorumSetConfiguration()
			);

			expect(result.isOk()).toBeFalsy();
			expect(pythonFbasAdapter.analyze).toHaveBeenCalled();
			expect(analyzer.performAnalysis).toHaveBeenCalled();
		});
	});

	function setupSUT(enablePythonFbas = false) {
		const networkScan = mock<NetworkScan>();
		const analyzer = mock<FbasAnalyzerService>();
		const pythonFbasAdapter = mock<PythonFbasAdapter>();
		const nodesInTransitiveNetworkQuorumSetFinder =
			mock<NodesInTransitiveNetworkQuorumSetFinder>();
		const config = mock<Config>();
		config.enablePythonFbas = enablePythonFbas;
		const logger = mock<Logger>();

		const networkScanner = new NetworkScanner(
			analyzer,
			pythonFbasAdapter,
			nodesInTransitiveNetworkQuorumSetFinder,
			config,
			logger
		);
		return {
			networkScan,
			analyzer,
			pythonFbasAdapter,
			nodesInTransitiveNetworkQuorumSetFinder,
			config,
			logger,
			networkScanner
		};
	}
});
