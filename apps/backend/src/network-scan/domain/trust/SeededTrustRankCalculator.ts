import { inject, injectable } from 'inversify';
import { TrustGraph, Network, Node } from 'shared';
import { PageRankAlgorithm } from './PageRankAlgorithm';
import { TrustGraphFactory } from '../node/scan/TrustGraphFactory';
import { 
	SeededTrustMetrics, 
	SeededTrustCalculationResult, 
	SeededPageRankConfiguration,
	DEFAULT_PAGERANK_CONFIG 
} from './TrustMetrics';
import { NETWORK_TYPES } from '../../infrastructure/di/di-types';
import { NodeOrganizationMappingService } from '../node/NodeOrganizationMappingService';

export interface OrganizationConfig {
	name: string;
	displayName: string;
	seedNodes: string[];
	autoDiscovery?: {
		enabled: boolean;
		domainPattern?: string;
		validatorKeyList?: string;
	};
}

@injectable()
export class SeededTrustRankCalculator {
	constructor(
		@inject(NETWORK_TYPES.PageRankAlgorithm)
		private pageRankAlgorithm: PageRankAlgorithm,
		@inject(NETWORK_TYPES.NodeOrganizationMappingService)
		private organizationService: NodeOrganizationMappingService
	) {}

	/**
	 * Calculates seeded trust metrics for a given organization
	 * @param network The network to analyze
	 * @param organizationConfig Configuration for the seed organization
	 * @returns Seeded trust calculation results
	 */
	async calculateSeededTrustMetrics(
		network: Network,
		organizationConfig: OrganizationConfig
	): Promise<SeededTrustCalculationResult> {
		const calculationTimestamp = new Date();

		// 1. Identify seed nodes for the organization
		const seedNodes = await this.identifyOrganizationValidators(network, organizationConfig);
		
		if (seedNodes.length === 0) {
			throw new Error(`No seed nodes found for organization: ${organizationConfig.name}`);
		}

		// 2. Create trust graph from network
		const trustGraph = this.createTrustGraph(network);

		// 3. Calculate seeded PageRank
		const seededConfig: SeededPageRankConfiguration = {
			...DEFAULT_PAGERANK_CONFIG,
			seedNodes: seedNodes.map(node => node.publicKey),
			seedWeight: 1.0
		};

		const pageRankResult = this.pageRankAlgorithm.calculateSeededPageRank(trustGraph, seededConfig);

		// 4. Calculate distances from seeds
		const distances = this.pageRankAlgorithm.calculateDistanceFromSeeds(
			trustGraph, 
			seededConfig.seedNodes
		);

		// 5. Normalize scores and create rankings
		const normalizedScores = this.pageRankAlgorithm.normalizeScores(pageRankResult.scores);
		const rankings = this.pageRankAlgorithm.createRankings(pageRankResult.scores);

		// 6. Build seeded trust metrics
		const seededTrustMetrics = new Map<string, SeededTrustMetrics>();

		network.nodes.forEach(node => {
			const rawScore = pageRankResult.scores.get(node.publicKey) || 0;
			const normalizedScore = normalizedScores.get(node.publicKey) || 0;
			const rank = rankings.get(node.publicKey) || network.nodes.length;
			const distanceFromSeeds = distances.get(node.publicKey) || Infinity;

			seededTrustMetrics.set(node.publicKey, {
				// Standard trust metrics (for compatibility)
				trustCentralityScore: normalizedScore,
				pageRankScore: rawScore,
				trustRank: rank,
				lastTrustCalculation: calculationTimestamp,

				// Seeded-specific metrics
				seededTrustCentralityScore: normalizedScore,
				seededPageRankScore: rawScore,
				seededTrustRank: rank,
				seedOrganization: organizationConfig.name,
				distanceFromSeeds: isFinite(distanceFromSeeds) ? distanceFromSeeds : -1
			});
		});

		return {
			seededTrustMetrics,
			convergenceAchieved: pageRankResult.convergenceAchieved,
			iterationsUsed: pageRankResult.iterationsUsed,
			calculationTimestamp,
			seedOrganization: organizationConfig.name
		};
	}

	/**
	 * Identifies validator nodes belonging to a specific organization
	 * @param network The network to search
	 * @param organizationConfig Organization configuration
	 * @returns Array of nodes belonging to the organization
	 */
	private async identifyOrganizationValidators(
		network: Network,
		organizationConfig: OrganizationConfig
	): Promise<Node[]> {
		const validators: Node[] = [];

		// 1. Add explicitly configured seed nodes
		organizationConfig.seedNodes.forEach(publicKey => {
			const node = network.getNodeByPublicKey(publicKey);
			if (node && node.isValidator) {
				validators.push(node);
			}
		});

		// 2. Auto-discovery based on configuration
		if (organizationConfig.autoDiscovery?.enabled) {
			const autoDiscoveredNodes = await this.autoDiscoverOrganizationValidators(
				network,
				organizationConfig
			);
			
			// Add unique auto-discovered nodes
			autoDiscoveredNodes.forEach(node => {
				if (!validators.find(v => v.publicKey === node.publicKey)) {
					validators.push(node);
				}
			});
		}

		return validators;
	}

	/**
	 * Auto-discovers organization validators based on domain patterns or other criteria
	 * @param network The network to search
	 * @param organizationConfig Organization configuration
	 * @returns Array of auto-discovered nodes
	 */
	private async autoDiscoverOrganizationValidators(
		network: Network,
		organizationConfig: OrganizationConfig
	): Promise<Node[]> {
		const autoDiscovered: Node[] = [];

		if (!organizationConfig.autoDiscovery) {
			return autoDiscovered;
		}

		// Domain pattern matching
		if (organizationConfig.autoDiscovery.domainPattern) {
			// Escape regex special characters except for wildcard '*', then convert '*' to '.*'
			const escapedPattern = organizationConfig.autoDiscovery.domainPattern
				.replace(/[.+?^${}()|[\]\\]/g, '\\$&')  // Escape regex special characters
				.replace(/\*/g, '.*');                    // Convert wildcards to regex equivalents
			
			const pattern = new RegExp(
				`^${escapedPattern}$`,  // Anchor to match full string
				'i'
			);

			network.nodes.forEach(node => {
				if (node.isValidator && node.host && pattern.test(node.host)) {
					autoDiscovered.push(node);
				}
			});
		}

		// Organization mapping service integration
		try {
			// Note: NodeOrganizationMappingService doesn't have getNodesByOrganization method
			// This would need to be implemented or use a different approach
			// For now, skip auto-discovery based on organization mapping
			console.warn(`Organization mapping auto-discovery not yet implemented for ${organizationConfig.name}`);
		} catch (error) {
			// Organization mapping might not be available, continue with other methods
			console.warn(`Could not retrieve organization mapping for ${organizationConfig.name}:`, error);
		}

		return autoDiscovered;
	}

	/**
	 * Creates a trust graph from the network's trust relationships
	 * @param network The network to analyze
	 * @returns Trust graph suitable for PageRank calculation
	 */
	private createTrustGraph(network: Network): TrustGraph {
		// Convert shared nodes to backend Node format for TrustGraphFactory
		const backendNodes = network.nodes.map(node => {
			// Create a minimal backend Node object with required properties
			return {
				publicKey: { value: node.publicKey },
				quorumSet: node.quorumSet ? { quorumSet: node.quorumSet } : null,
				isValidator: node.isFullValidator || node.isValidating
			};
		}) as any;
		
		return TrustGraphFactory.create(backendNodes);
	}

	/**
	 * Validates that seed nodes exist and are validators in the network
	 * @param network The network to validate against
	 * @param seedNodes Array of seed node public keys
	 * @returns Validation result
	 */
	validateSeedNodes(network: Network, seedNodes: string[]): {
		valid: boolean;
		validSeeds: string[];
		invalidSeeds: string[];
		nonValidatorSeeds: string[];
	} {
		const validSeeds: string[] = [];
		const invalidSeeds: string[] = [];
		const nonValidatorSeeds: string[] = [];

		seedNodes.forEach(publicKey => {
			const node = network.getNodeByPublicKey(publicKey);
			
			if (!node) {
				invalidSeeds.push(publicKey);
			} else if (!node.isValidator) {
				nonValidatorSeeds.push(publicKey);
			} else {
				validSeeds.push(publicKey);
			}
		});

		return {
			valid: invalidSeeds.length === 0 && nonValidatorSeeds.length === 0,
			validSeeds,
			invalidSeeds,
			nonValidatorSeeds
		};
	}

	/**
	 * Gets summary statistics for seeded trust calculation
	 * @param result Seeded trust calculation result
	 * @returns Summary statistics
	 */
	getCalculationSummary(result: SeededTrustCalculationResult): {
		totalNodes: number;
		seedNodes: number;
		reachableNodes: number;
		unreachableNodes: number;
		averageDistance: number;
		maxDistance: number;
	} {
		const metrics = Array.from(result.seededTrustMetrics.values());
		const reachableMetrics = metrics.filter(m => m.distanceFromSeeds >= 0);
		const unreachableMetrics = metrics.filter(m => m.distanceFromSeeds < 0);
		const seedMetrics = metrics.filter(m => m.distanceFromSeeds === 0);

		const distances = reachableMetrics
			.map(m => m.distanceFromSeeds)
			.filter(d => d > 0); // Exclude seeds from average

		return {
			totalNodes: metrics.length,
			seedNodes: seedMetrics.length,
			reachableNodes: reachableMetrics.length,
			unreachableNodes: unreachableMetrics.length,
			averageDistance: distances.length > 0 
				? distances.reduce((sum, d) => sum + d, 0) / distances.length 
				: 0,
			maxDistance: distances.length > 0 ? Math.max(...distances) : 0
		};
	}
}