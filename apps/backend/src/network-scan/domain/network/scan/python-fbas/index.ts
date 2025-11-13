/**
 * Python FBAS Scanner Integration
 *
 * This module provides a complete replacement for the Rust FBAS scanner,
 * removing the tier 1 organization cap and enabling unlimited organization analysis.
 *
 * Key components:
 * - FbasAggregator: Aggregates nodes by organization/country/ISP
 * - FbasFilteredAnalyzer: Handles filtered vs unfiltered analysis
 * - PythonFbasAdapter: Main adapter orchestrating the analysis flow
 * - PythonFbasHttpClient: HTTP client for Python FBAS service
 *
 * Usage:
 *
 * ```typescript
 * import {
 *   PythonFbasAdapter,
 *   PythonFbasHttpClientFactory,
 *   FbasAggregator,
 *   FbasFilteredAnalyzer
 * } from './python-fbas';
 *
 * // Create adapter
 * const httpClient = PythonFbasHttpClientFactory.create();
 * const aggregator = new FbasAggregator();
 * const filteredAnalyzer = new FbasFilteredAnalyzer();
 * const adapter = new PythonFbasAdapter(httpClient, aggregator, filteredAnalyzer);
 *
 * // Run analysis
 * const result = await adapter.analyze(nodes, organizations);
 * if (result.isOk()) {
 *   const analysis = result.value;
 *   console.log('Top tier size:', analysis.node.topTierSize);
 *   console.log('Organization level:', analysis.organization);
 * }
 * ```
 */

export { FbasAggregator, AggregatedNode, AggregationType } from './FbasAggregator';
export {
	FbasFilteredAnalyzer,
	FilteredAnalysisInput,
	FilteredAnalysisResult
} from './FbasFilteredAnalyzer';
export {
	PythonFbasAdapter,
	IPythonFbasHttpClient,
	PythonFbasNode,
	PythonFbasAnalysisRequest,
	PythonFbasTopTierResponse,
	PythonFbasBlockingSetsResponse,
	PythonFbasSplittingSetsResponse,
	PythonFbasQuorumsResponse
} from './PythonFbasAdapter';
export {
	PythonFbasHttpClient,
	PythonFbasHttpClientFactory,
	PythonFbasHttpClientConfig
} from './PythonFbasHttpClient';
