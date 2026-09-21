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

/**
 * Node-level analysis carries the top tier membership alongside the merged
 * sizes, because the symmetric top tier check needs to know *which* nodes are
 * in the top tier — not just how many.
 */
interface NodeLevelAnalysis {
	merged: AnalysisMergedResult;
	topTier: string[];
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

			// The node level is the base of the analysis -- without it there is
			// nothing to report, so its failure is fatal.
			if (nodeResult.isErr()) return err(nodeResult.error);

			// The aggregated levels degrade independently. Previously any one of
			// them failing discarded all four, so a country-level problem threw
			// away perfectly good node and organization results for the entire
			// scan. Aggregated levels fail for mundane reasons -- e.g. geo data
			// lookups timing out leaves every node without a country -- and that
			// should not cost the scan its other answers.
			const nodeAnalysis = nodeResult.value.merged;
			const orgAnalysis = this.levelOrDegraded('organization', orgResult);
			const countryAnalysis = this.levelOrDegraded('country', countryResult);
			const ispAnalysis = this.levelOrDegraded('isp', ispResult);

			// Check quorum intersection at node level
			const quorumIntersectionResult = await this.checkQuorumIntersection(
				validNodes
			);
			if (quorumIntersectionResult.isErr())
				return err(quorumIntersectionResult.error);

			const analysisResult: AnalysisResult = {
				hasQuorumIntersection: quorumIntersectionResult.value,
				hasSymmetricTopTier: this.isTopTierSymmetric(
					validNodes,
					nodeResult.value.topTier
				),
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
	): Promise<Result<NodeLevelAnalysis, Error>> {
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

		const topTier = topTierResult.value.top_tier ?? [];

		const splittingSetsTopTierMinSize = await this.analyzeTopTierSplittingSets(
			allNodesRequest,
			topTier
		);

		return ok({
			merged: {
				topTierSize: topTierResult.value.top_tier_size,
				blockingSetsMinSize: blockingAllResult.value.min_size,
				blockingSetsFilteredMinSize: blockingFilteredResult.value.min_size,
				splittingSetsMinSize: splittingResult.value.min_size,
				splittingSetsTopTierMinSize
			},
			topTier
		});
	}

	/**
	 * Unwrap an aggregated level, or record why it is missing and fall back to
	 * zeroes.
	 *
	 * NOTE: zero is a poor stand-in for "not analyzed" -- downstream this is
	 * rendered as a threshold, so a degraded country level currently reads as
	 * "0 countries can break safety" rather than "we could not tell". Carrying
	 * that distinction needs a nullable representation through NetworkMeasurement
	 * and the API; until then the log is the only honest signal, so it is an
	 * error-level one.
	 */
	private levelOrDegraded(
		level: 'organization' | 'country' | 'isp',
		result: Result<AnalysisMergedResult, Error>
	): AnalysisMergedResult {
		if (result.isOk()) return result.value;

		console.error(
			`[PythonFbas] ${level} level analysis failed, reporting zeroes for it:`,
			result.error.message
		);

		return {
			topTierSize: 0,
			blockingSetsMinSize: 0,
			blockingSetsFilteredMinSize: 0,
			splittingSetsMinSize: 0,
			splittingSetsTopTierMinSize: undefined
		};
	}

	/**
	 * A top tier is symmetric when every node in it declares the same quorum
	 * set. Radar uses this to decide whether the browser-side analysis is cheap
	 * enough to run automatically, so returning a wrong `false` permanently
	 * shows the "analysis could be slow" warning and drops the UI into manual
	 * mode.
	 *
	 * python-fbas has no equivalent command, so the comparison is done here
	 * against the quorum sets Radar already holds.
	 */
	private isTopTierSymmetric(nodes: Node[], topTier: string[]): boolean {
		// An empty top tier is not a symmetric one — it means the analysis
		// found nothing, which is a different thing entirely.
		if (topTier.length === 0) return false;

		const quorumSetsByPublicKey = new Map<string, QuorumSet>();
		nodes.forEach((node) => {
			const quorumSet = node.quorumSet?.quorumSet;
			if (quorumSet) {
				quorumSetsByPublicKey.set(node.publicKey.value, quorumSet);
			}
		});

		let reference: string | null = null;
		for (const publicKey of topTier) {
			const quorumSet = quorumSetsByPublicKey.get(publicKey);
			// A top tier member we cannot inspect makes the answer unknowable,
			// and unknowable is not symmetric.
			if (!quorumSet) return false;

			const fingerprint = this.fingerprintQuorumSet(quorumSet);
			if (reference === null) {
				reference = fingerprint;
			} else if (fingerprint !== reference) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Order-independent structural fingerprint of a quorum set, so two nodes
	 * that declare the same trust in a different order compare as equal.
	 */
	private fingerprintQuorumSet(quorumSet: QuorumSet): string {
		const validators = [...quorumSet.validators].sort();
		const innerQuorumSets = quorumSet.innerQuorumSets
			.map((innerQuorumSet) => this.fingerprintQuorumSet(innerQuorumSet))
			.sort();

		return JSON.stringify([quorumSet.threshold, validators, innerQuorumSets]);
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
			aggregatedCount: aggregatedNodes.length,
			orgsWithInvalidThreshold: detailedOrgs.filter(
				(org) => org.hasInvalidThreshold
			).length
		});

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

		// The splitting set above is network-wide: it includes separating an
		// outlying entity from the core, which takes fewer failures than
		// splitting the core itself. Run it again over just the top tier so the
		// two questions can be answered separately.
		const splittingSetsTopTierMinSize = await this.analyzeTopTierSplittingSets(
			allNodesRequest,
			topTierResult.value.top_tier ?? []
		);

		const result = {
			topTierSize: topTierResult.value.top_tier_size,
			blockingSetsMinSize: blockingAllResult.value.min_size,
			blockingSetsFilteredMinSize: blockingFilteredResult.value.min_size,
			splittingSetsMinSize: splittingResult.value.min_size,
			splittingSetsTopTierMinSize
		};

		console.log('[PythonFbas] Analysis results from Python service:', result);

		return ok(result);
	}

	/**
	 * Smallest splitting set within the top tier.
	 *
	 * Restricting the FBAS to the top tier is what python-fbas does with
	 * --reachable-from <top tier validator>; here the same restriction is
	 * expressed by sending only the top tier members, whose quorum sets by
	 * definition reference each other.
	 *
	 * This is an additive statistic, so it must never be able to take a scan
	 * down: every failure path returns undefined, meaning "not computed", and
	 * leaves the network-wide answer alone. Undefined is deliberately not zero,
	 * which downstream would render as a threshold of zero organizations.
	 */
	private async analyzeTopTierSplittingSets(
		request: PythonFbasAnalysisRequest,
		topTier: string[]
	): Promise<number | undefined> {
		//A top tier of fewer than two entities has nothing to split. This was the
		//one path that returned undefined without saying so, which made a null
		//result downstream indistinguishable from a failure.
		if (topTier.length < 2) {
			console.error(
				`[PythonFbas] Skipping top tier splitting set: top tier has ` +
					`${topTier.length} member(s), nothing to split`
			);
			return undefined;
		}

		const topTierMembers = new Set(topTier);
		const topTierNodes = request.nodes.filter((node) =>
			topTierMembers.has(node.publicKey)
		);

		//The service reported a top tier we cannot resolve back to what we sent
		//it -- most likely the CLI output was parsed into names that no longer
		//match our public keys. Analysing the subset we happened to match would
		//produce an authoritative-looking number for a different question.
		if (topTierNodes.length !== topTier.length) {
			console.error(
				`[PythonFbas] Skipping top tier splitting set: ${topTier.length} ` +
					`members reported, ${topTierNodes.length} resolved in the analysed set. ` +
					`Reported: ${JSON.stringify(topTier.slice(0, 5))}; ` +
					`available: ${JSON.stringify(request.nodes.slice(0, 5).map((n) => n.publicKey))}`
			);
			return undefined;
		}

		const result = await this.httpClient.analyzeSplittingSets({
			nodes: topTierNodes,
			organizations: []
		});

		if (result.isErr()) {
			console.error(
				'[PythonFbas] Top tier splitting set analysis failed:',
				result.error.message
			);
			return undefined;
		}

		return result.value.min_size;
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
