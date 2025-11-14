/**
 * PythonFbasAdapter - Complete adapter for Python FBAS scanner
 *
 * This adapter:
 * 1. Aggregates nodes by organization/country/ISP (removing tier 1 org cap)
 * 2. Performs filtered analysis (all nodes vs validating nodes)
 * 3. Calls Python FBAS HTTP service for analysis
 * 4. Maps results to AnalysisResult structure
 *
 * This is the replacement for FbasAnalyzerFacade (Rust scanner)
 */

import Node from '../../../node/Node';
import Organization from '../../../organization/Organization';
import { AnalysisResult } from '../fbas-analysis/AnalysisResult';
import { AnalysisMergedResult } from '../fbas-analysis/AnalysisMergedResult';
import { FbasAggregator, AggregatedNode } from './FbasAggregator';
import { FbasFilteredAnalyzer } from './FbasFilteredAnalyzer';
import { QuorumSet } from 'shared';
import { Result, ok, err } from 'neverthrow';

/**
 * Python FBAS service input format
 */
export interface PythonFbasNode {
	publicKey: string;
	name: string | null;
	quorumSet: QuorumSet | null;
	geoData: {
		countryName: string | null;
	} | null;
	isp: string | null;
}

export interface PythonFbasAnalysisRequest {
	nodes: PythonFbasNode[];
	organizations: {
		id: string;
		name: string | null;
		validators: string[];
	}[];
}

/**
 * Python FBAS service response formats
 */
export interface PythonFbasTopTierResponse {
	top_tier: string[];
	top_tier_size: number;
}

export interface PythonFbasBlockingSetsResponse {
	min_size: number;
}

export interface PythonFbasSplittingSetsResponse {
	min_size: number;
}

export interface PythonFbasQuorumsResponse {
	quorum_intersection: boolean;
}

/**
 * HTTP client interface for Python FBAS service
 * (To be implemented separately)
 */
export interface IPythonFbasHttpClient {
	analyzeTopTier(
		request: PythonFbasAnalysisRequest
	): Promise<Result<PythonFbasTopTierResponse, Error>>;
	analyzeBlockingSets(
		request: PythonFbasAnalysisRequest
	): Promise<Result<PythonFbasBlockingSetsResponse, Error>>;
	analyzeSplittingSets(
		request: PythonFbasAnalysisRequest
	): Promise<Result<PythonFbasSplittingSetsResponse, Error>>;
	analyzeQuorums(
		request: PythonFbasAnalysisRequest
	): Promise<Result<PythonFbasQuorumsResponse, Error>>;
	healthCheck(): Promise<Result<{ status: string }, Error>>;
}

export class PythonFbasAdapter {
	constructor(
		private readonly httpClient: IPythonFbasHttpClient,
		private readonly aggregator: FbasAggregator,
		private readonly filteredAnalyzer: FbasFilteredAnalyzer
	) {}

	/**
	 * Main analysis method - performs complete FBAS analysis at all levels
	 *
	 * This replaces the Rust scanner's analyze() method
	 */
	async analyze(
		nodes: Node[],
		organizations: Organization[]
	): Promise<Result<AnalysisResult, Error>> {
		// Filter nodes with valid quorum sets
		const validNodes = nodes.filter(
			(node) => node.quorumSet && node.quorumSet.quorumSet.threshold > 0
		);

		if (validNodes.length === 0) {
			return err(
				new Error('No nodes with valid quorum sets available for analysis')
			);
		}

		try {
			// Perform analysis at all 4 levels in parallel
			const [nodeResult, orgResult, countryResult, ispResult] =
				await Promise.all([
					this.analyzeNodeLevel(validNodes),
					this.analyzeOrganizationLevel(validNodes, organizations),
					this.analyzeCountryLevel(validNodes),
					this.analyzeISPLevel(validNodes)
				]);

			// Check for errors
			if (nodeResult.isErr()) return err(nodeResult.error);
			if (orgResult.isErr()) return err(orgResult.error);
			if (countryResult.isErr()) return err(countryResult.error);
			if (ispResult.isErr()) return err(ispResult.error);

			const nodeAnalysis = nodeResult.value;
			const orgAnalysis = orgResult.value;
			const countryAnalysis = countryResult.value;
			const ispAnalysis = ispResult.value;

			// Check quorum intersection at node level
			const quorumIntersectionResult = await this.checkQuorumIntersection(
				validNodes
			);
			if (quorumIntersectionResult.isErr())
				return err(quorumIntersectionResult.error);

			const analysisResult: AnalysisResult = {
				hasQuorumIntersection: quorumIntersectionResult.value,
				// TODO: Implement symmetric top tier check
				hasSymmetricTopTier: false,
				node: nodeAnalysis,
				organization: orgAnalysis,
				country: countryAnalysis,
				isp: ispAnalysis
			};

			return ok(analysisResult);
		} catch (error) {
			return err(
				new Error(
					`Python FBAS analysis failed: ${error instanceof Error ? error.message : String(error)}`
				)
			);
		}
	}

	/**
	 * Analyze at node level (no aggregation)
	 */
	private async analyzeNodeLevel(
		nodes: Node[]
	): Promise<Result<AnalysisMergedResult, Error>> {
		// Split into all vs validating
		const filtered = this.filteredAnalyzer.prepareFilteredAnalysis({ nodes });

		// Validate
		const validation = this.filteredAnalyzer.validateFilteredResults(filtered);
		if (!validation.valid) {
			return err(
				new Error(
					`Node level filtered analysis validation failed: ${validation.errors.join(', ')}`
				)
			);
		}

		// Convert to Python format
		const allNodesRequest = this.nodesToPythonRequest(
			filtered.allNodes as Node[]
		);
		const validatingNodesRequest = this.nodesToPythonRequest(
			filtered.validatingNodes as Node[]
		);

		// Run analyses in parallel
		const [topTierResult, blockingAllResult, blockingFilteredResult, splittingResult] =
			await Promise.all([
				this.httpClient.analyzeTopTier(allNodesRequest),
				this.httpClient.analyzeBlockingSets(allNodesRequest),
				this.httpClient.analyzeBlockingSets(validatingNodesRequest),
				this.httpClient.analyzeSplittingSets(allNodesRequest)
			]);

		// Check for errors
		if (topTierResult.isErr()) return err(topTierResult.error);
		if (blockingAllResult.isErr()) return err(blockingAllResult.error);
		if (blockingFilteredResult.isErr())
			return err(blockingFilteredResult.error);
		if (splittingResult.isErr()) return err(splittingResult.error);

		return ok({
			topTierSize: topTierResult.value.top_tier_size,
			blockingSetsMinSize: blockingAllResult.value.min_size,
			blockingSetsFilteredMinSize: blockingFilteredResult.value.min_size,
			splittingSetsMinSize: splittingResult.value.min_size
		});
	}

	/**
	 * Analyze at organization level (aggregate by organization)
	 */
	private async analyzeOrganizationLevel(
		nodes: Node[],
		organizations: Organization[]
	): Promise<Result<AnalysisMergedResult, Error>> {
		// Aggregate by organization
		const aggregatedNodes = this.aggregator.aggregateByOrganization(
			nodes,
			organizations
		);

		// Log ALL organizations in detail
		const detailedOrgs = aggregatedNodes.map(n => ({
			publicKey: n.publicKey,
			name: n.name,
			validatorCount: n._originalValidators.length,
			threshold: n.quorumSet?.threshold || 0,
			validators: n.quorumSet?.validators || [],
			validatorCount_in_qs: (n.quorumSet?.validators || []).length,
			hasInvalidThreshold: (n.quorumSet?.threshold || 0) > (n.quorumSet?.validators || []).length
		}));

		console.log('[PythonFbas] Organization aggregation summary:', {
			totalNodes: nodes.length,
			totalOrganizations: organizations.length,
			aggregatedCount: aggregatedNodes.length
		});
		console.log('[PythonFbas] ALL Detailed orgs:', JSON.stringify(detailedOrgs, null, 2));

		// Validate aggregation
		const validation =
			this.aggregator.validateAggregatedNodes(aggregatedNodes);
		if (!validation.valid) {
			return err(
				new Error(
					`Organization aggregation validation failed: ${validation.errors.join(', ')}`
				)
			);
		}

		// Split into all vs validating
		const filtered = this.filteredAnalyzer.prepareFilteredAnalysis({
			nodes,
			aggregatedNodes
		});

		console.log('[PythonFbas] Filtered analysis:', {
			allNodesCount: filtered.allNodes.length,
			validatingNodesCount: filtered.validatingNodes.length
		});

		// Convert to Python format
		const allNodesRequest = this.aggregatedNodesToPythonRequest(
			filtered.allNodes as AggregatedNode[]
		);
		const validatingNodesRequest = this.aggregatedNodesToPythonRequest(
			filtered.validatingNodes as AggregatedNode[]
		);

		console.log('[PythonFbas] Request sizes:', {
			allNodesRequestCount: allNodesRequest.nodes.length,
			validatingNodesRequestCount: validatingNodesRequest.nodes.length
		});

		// Log cleaned quorum sets (first 3)
		const cleanedSample = allNodesRequest.nodes.slice(0, 3).map((n) => ({
			publicKey: n.publicKey,
			name: n.name,
			threshold: n.quorumSet?.threshold || 0,
			validators: n.quorumSet?.validators || [],
			validatorCount: (n.quorumSet?.validators || []).length
		}));
		console.log(
			'[PythonFbas] Cleaned QS (self-refs removed):',
			JSON.stringify(cleanedSample, null, 2)
		);

		// DEBUG: Write full request to file for debugging
		const fs = require('fs');
		fs.writeFileSync(
			'/tmp/python-fbas-request.json',
			JSON.stringify(allNodesRequest, null, 2)
		);
		console.log('[PythonFbas] Wrote full request to /tmp/python-fbas-request.json');

		// Run analyses
		return await this.runAggregatedAnalysis(
			allNodesRequest,
			validatingNodesRequest
		);
	}

	/**
	 * Analyze at country level (aggregate by country)
	 */
	private async analyzeCountryLevel(
		nodes: Node[]
	): Promise<Result<AnalysisMergedResult, Error>> {
		// Aggregate by country
		const aggregatedNodes = this.aggregator.aggregateByCountry(nodes);

		// Validate aggregation
		const validation =
			this.aggregator.validateAggregatedNodes(aggregatedNodes);
		if (!validation.valid) {
			return err(
				new Error(
					`Country aggregation validation failed: ${validation.errors.join(', ')}`
				)
			);
		}

		// Split into all vs validating
		const filtered = this.filteredAnalyzer.prepareFilteredAnalysis({
			nodes,
			aggregatedNodes
		});

		// Convert to Python format
		const allNodesRequest = this.aggregatedNodesToPythonRequest(
			filtered.allNodes as AggregatedNode[]
		);
		const validatingNodesRequest = this.aggregatedNodesToPythonRequest(
			filtered.validatingNodes as AggregatedNode[]
		);

		// Run analyses
		return await this.runAggregatedAnalysis(
			allNodesRequest,
			validatingNodesRequest
		);
	}

	/**
	 * Analyze at ISP level (aggregate by ISP)
	 */
	private async analyzeISPLevel(
		nodes: Node[]
	): Promise<Result<AnalysisMergedResult, Error>> {
		// Aggregate by ISP
		const aggregatedNodes = this.aggregator.aggregateByISP(nodes);

		// Validate aggregation
		const validation =
			this.aggregator.validateAggregatedNodes(aggregatedNodes);
		if (!validation.valid) {
			return err(
				new Error(
					`ISP aggregation validation failed: ${validation.errors.join(', ')}`
				)
			);
		}

		// Split into all vs validating
		const filtered = this.filteredAnalyzer.prepareFilteredAnalysis({
			nodes,
			aggregatedNodes
		});

		// Convert to Python format
		const allNodesRequest = this.aggregatedNodesToPythonRequest(
			filtered.allNodes as AggregatedNode[]
		);
		const validatingNodesRequest = this.aggregatedNodesToPythonRequest(
			filtered.validatingNodes as AggregatedNode[]
		);

		// Run analyses
		return await this.runAggregatedAnalysis(
			allNodesRequest,
			validatingNodesRequest
		);
	}

	/**
	 * Run analysis on aggregated nodes (org/country/ISP)
	 */
	private async runAggregatedAnalysis(
		allNodesRequest: PythonFbasAnalysisRequest,
		validatingNodesRequest: PythonFbasAnalysisRequest
	): Promise<Result<AnalysisMergedResult, Error>> {
		// Run analyses in parallel
		const [topTierResult, blockingAllResult, blockingFilteredResult, splittingResult] =
			await Promise.all([
				this.httpClient.analyzeTopTier(allNodesRequest),
				this.httpClient.analyzeBlockingSets(allNodesRequest),
				this.httpClient.analyzeBlockingSets(validatingNodesRequest),
				this.httpClient.analyzeSplittingSets(allNodesRequest)
			]);

		// Check for errors
		if (topTierResult.isErr()) return err(topTierResult.error);
		if (blockingAllResult.isErr()) return err(blockingAllResult.error);
		if (blockingFilteredResult.isErr())
			return err(blockingFilteredResult.error);
		if (splittingResult.isErr()) return err(splittingResult.error);

		const result = {
			topTierSize: topTierResult.value.top_tier_size,
			blockingSetsMinSize: blockingAllResult.value.min_size,
			blockingSetsFilteredMinSize: blockingFilteredResult.value.min_size,
			splittingSetsMinSize: splittingResult.value.min_size
		};

		console.log('[PythonFbas] Analysis results from Python service:', result);

		return ok(result);
	}

	/**
	 * Check quorum intersection at node level
	 */
	private async checkQuorumIntersection(
		nodes: Node[]
	): Promise<Result<boolean, Error>> {
		const request = this.nodesToPythonRequest(nodes);
		const result = await this.httpClient.analyzeQuorums(request);

		if (result.isErr()) return err(result.error);

		return ok(result.value.quorum_intersection);
	}

	/**
	 * Convert domain Nodes to Python FBAS format
	 */
	private nodesToPythonRequest(nodes: Node[]): PythonFbasAnalysisRequest {
		return {
			nodes: nodes.map((node) => this.nodeToPythonNode(node)),
			organizations: []
		};
	}

	/**
	 * Convert aggregated nodes to Python FBAS format
	 *
	 * IMPORTANT: Preserves self-references in quorum sets for aggregated organizations.
	 * Unlike individual validators, aggregated organizations MUST include themselves because:
	 * - An organization represents ALL its validators as a group
	 * - The organization is not implicitly satisfied
	 * - Without self-reference, circular dependencies form where no org can form a quorum
	 */
	private aggregatedNodesToPythonRequest(
		aggregatedNodes: AggregatedNode[]
	): PythonFbasAnalysisRequest {
		return {
			nodes: aggregatedNodes.map((node) => {
				// Use quorum set as-is - self-references are necessary for aggregated orgs
				// DO NOT remove self-references! This creates circular dependencies where
				// no org can form a quorum (topTierSize=0, splittingSetsMinSize=0)
				return {
					publicKey: node.publicKey,
					name: node.name,
					quorumSet: node.quorumSet,
					geoData: node.geoData,
					isp: node.isp
				};
			}),
			organizations: []
		};
	}

	/**
	 * Remove self-references from a quorum set
	 * Returns a new QuorumSet with the node's own publicKey filtered out
	 *
	 * IMPORTANT: When removing self-references, we DON'T adjust the threshold.
	 * Rationale: A node implicitly trusts itself. If a node says "I need threshold T
	 * out of N validators (including myself)", removing the self-reference should
	 * give us "I need threshold T out of N-1 external validators", NOT "T-1 out of N-1".
	 *
	 * Example: SDF aggregate says "need 2 out of {SDF, LOBSTR, Blockdaemon}"
	 * After removing self: "need 2 out of {LOBSTR, Blockdaemon}" (still need 2 external orgs)
	 */
	private removeSelfReference(
		nodePublicKey: string,
		quorumSet: QuorumSet
	): QuorumSet {
		// Filter out self-reference from validators array
		const filteredValidators = quorumSet.validators.filter(
			(validator: string) => validator !== nodePublicKey
		);

		// Recursively clean inner quorum sets
		const cleanedInnerQs = quorumSet.innerQuorumSets.map((innerQs) =>
			this.removeSelfReference(nodePublicKey, innerQs)
		);

		// Calculate total available votes after removing self-reference
		const totalAvailable = filteredValidators.length + cleanedInnerQs.length;

		// Keep original threshold, but cap it at total available votes
		// (can't require more validators than exist)
		const adjustedThreshold = Math.min(quorumSet.threshold, Math.max(1, totalAvailable));

		return new QuorumSet(
			adjustedThreshold,
			filteredValidators,
			cleanedInnerQs
		);
	}

	/**
	 * Convert domain Node to Python FbasNode
	 */
	private nodeToPythonNode(node: Node): PythonFbasNode {
		return {
			publicKey: node.publicKey.value,
			name: node.details?.name ?? null,
			quorumSet: node.quorumSet?.quorumSet ?? null,
			geoData: node.geoData
				? {
						countryName: node.geoData.countryName ?? null
				  }
				: null,
			isp: node.isp ?? null
		};
	}
}
