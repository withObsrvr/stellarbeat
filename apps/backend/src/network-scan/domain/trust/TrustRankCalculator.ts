import { TrustGraph, PublicKey } from 'shared';
import { PageRankAlgorithm } from './PageRankAlgorithm';
import {
	TrustMetrics,
	PageRankConfiguration,
	DEFAULT_PAGERANK_CONFIG,
	NodeTrustData,
	TrustCalculationResult
} from './TrustMetrics';
import { injectable } from 'inversify';
import 'reflect-metadata';

export interface ITrustRankCalculator {
	calculateTrustMetrics(
		trustGraph: TrustGraph,
		nodeData: Map<PublicKey, NodeTrustData>,
		config?: PageRankConfiguration
	): TrustCalculationResult;
}

@injectable()
export class TrustRankCalculator implements ITrustRankCalculator {
	private readonly pageRankAlgorithm: PageRankAlgorithm;

	constructor() {
		this.pageRankAlgorithm = new PageRankAlgorithm();
	}

	/**
	 * Calculates comprehensive trust metrics for all nodes in the network
	 * @param trustGraph The trust relationship graph
	 * @param nodeData Additional node metadata
	 * @param config PageRank algorithm configuration
	 * @returns Complete trust calculation results
	 */
	public calculateTrustMetrics(
		trustGraph: TrustGraph,
		nodeData: Map<PublicKey, NodeTrustData>,
		config: PageRankConfiguration = DEFAULT_PAGERANK_CONFIG
	): TrustCalculationResult {
		const calculationTimestamp = new Date();

		// Calculate base PageRank scores
		const pageRankResult = this.pageRankAlgorithm.calculatePageRank(trustGraph, config);
		
		// Normalize PageRank scores to 0-100 scale
		const normalizedPageRankScores = this.pageRankAlgorithm.normalizeScores(pageRankResult.scores);
		
		// Calculate trust centrality scores (enhanced PageRank with organizational diversity)
		const trustCentralityScores = this.calculateTrustCentralityScores(
			trustGraph,
			normalizedPageRankScores,
			nodeData
		);
		
		// Create rankings based on trust centrality
		const trustRankings = this.pageRankAlgorithm.createRankings(trustCentralityScores);

		// Build final trust metrics map
		const trustMetrics = new Map<string, TrustMetrics>();
		
		Array.from(trustGraph.vertices.keys()).forEach((publicKey: PublicKey) => {
			const pageRankScore = normalizedPageRankScores.get(publicKey) || 0;
			const trustCentralityScore = trustCentralityScores.get(publicKey) || 0;
			const trustRank = trustRankings.get(publicKey) || Number.MAX_SAFE_INTEGER;

			trustMetrics.set(publicKey, {
				trustCentralityScore,
				pageRankScore,
				trustRank,
				lastTrustCalculation: calculationTimestamp
			});
		});

		return {
			trustMetrics,
			convergenceAchieved: pageRankResult.convergenceAchieved,
			iterationsUsed: pageRankResult.iterationsUsed,
			calculationTimestamp
		};
	}

	/**
	 * Calculates trust centrality scores by enhancing PageRank with organizational diversity
	 * @param trustGraph The trust relationship graph
	 * @param pageRankScores Base PageRank scores (0-100)
	 * @param nodeData Node metadata including organization information
	 * @returns Enhanced trust centrality scores
	 */
	private calculateTrustCentralityScores(
		trustGraph: TrustGraph,
		pageRankScores: Map<string, number>,
		nodeData: Map<PublicKey, NodeTrustData>
	): Map<string, number> {
		const trustCentralityScores = new Map<string, number>();

		Array.from(trustGraph.vertices.keys()).forEach((publicKey: PublicKey) => {
			const basePageRankScore = pageRankScores.get(publicKey) || 0;
			const node = nodeData.get(publicKey);
			
			if (!node) {
				trustCentralityScores.set(publicKey, basePageRankScore);
				return;
			}

			// Calculate organizational diversity bonus
			const organizationalDiversityBonus = this.calculateOrganizationalDiversityBonus(
				trustGraph,
				publicKey,
				nodeData
			);

			// Calculate validator bonus (validators are more important for consensus)
			const validatorBonus = node.isValidator ? 1.1 : 1.0;

			// Apply bonuses to base PageRank score
			const enhancedScore = basePageRankScore * organizationalDiversityBonus * validatorBonus;
			
			// Ensure score stays within 0-100 bounds
			const boundedScore = Math.min(100, Math.max(0, enhancedScore));
			
			trustCentralityScores.set(publicKey, boundedScore);
		});

		// Re-normalize to ensure proper 0-100 distribution
		return this.pageRankAlgorithm.normalizeScores(trustCentralityScores);
	}

	/**
	 * Calculates a bonus multiplier based on organizational diversity of incoming trust
	 * @param trustGraph The trust relationship graph
	 * @param publicKey The node to analyze
	 * @param nodeData Node metadata
	 * @returns Multiplier between 1.0 and 2.0 based on organizational diversity
	 */
	private calculateOrganizationalDiversityBonus(
		trustGraph: TrustGraph,
		publicKey: PublicKey,
		nodeData: Map<PublicKey, NodeTrustData>
	): number {
		const vertex = trustGraph.getVertex(publicKey);
		if (!vertex) {
			return 1.0;
		}

		const parents = trustGraph.getParents(vertex);
		const uniqueOrganizations = new Set<string>();
		let totalIncomingTrust = 0;

		// Collect organizations that trust this node
		parents.forEach((parent: any) => {
			const parentData = nodeData.get(parent.key);
			if (parentData?.organizationId) {
				uniqueOrganizations.add(parentData.organizationId);
			}
			totalIncomingTrust++;
		});

		// If no incoming trust, return base multiplier
		if (totalIncomingTrust === 0) {
			return 1.0;
		}

		// Calculate diversity ratio (unique orgs / total incoming trust)
		const diversityRatio = uniqueOrganizations.size / totalIncomingTrust;
		
		// Calculate bonus based on both number of unique organizations and diversity ratio
		const organizationCountBonus = Math.min(uniqueOrganizations.size / 5, 1.0); // Cap at 5 orgs
		const diversityRatioBonus = diversityRatio;
		
		// Combine bonuses: 1.0 (base) + up to 0.5 (org count) + up to 0.5 (diversity ratio)
		const totalBonus = 1.0 + (organizationCountBonus * 0.5) + (diversityRatioBonus * 0.5);
		
		return Math.min(2.0, totalBonus); // Cap at 2.0x multiplier
	}
}