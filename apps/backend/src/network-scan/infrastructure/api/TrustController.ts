// Controller for trust-related API endpoints
import { inject, injectable } from 'inversify';
import { Network } from 'shared';
import { SeededTrustRankCalculator } from '../../domain/trust/SeededTrustRankCalculator';
import { TrustConfigService, OrganizationTrustConfig } from '../../domain/trust/TrustConfig';
import { SeededTrustMetrics, SeededTrustCalculationResult } from '../../domain/trust/TrustMetrics';
import { NETWORK_TYPES } from '../di/di-types';

export interface SeededTrustResponse {
	organization: string;
	timestamp: string;
	metrics: SeededTrustNodeMetrics[];
	summary: {
		totalNodes: number;
		seedNodes: number;
		reachableNodes: number;
		unreachableNodes: number;
		averageDistance: number;
		maxDistance: number;
		convergenceAchieved: boolean;
		iterationsUsed: number;
	};
}

export interface SeededTrustNodeMetrics {
	publicKey: string;
	name?: string;
	seededTrustCentralityScore: number;
	seededTrustRank: number;
	distanceFromSeeds: number;
	isSeed: boolean;
}

export interface SeedNodesResponse {
	organization: string;
	seeds: SeedNodeInfo[];
}

export interface SeedNodeInfo {
	publicKey: string;
	name?: string;
	active: boolean;
	isValidator: boolean;
	discoveryMethod: 'configured' | 'auto-domain' | 'auto-organization';
}

export interface OrganizationsResponse {
	organizations: OrganizationInfo[];
	defaultOrganization: string;
}

export interface OrganizationInfo {
	name: string;
	displayName: string;
	seedCount: number;
	autoDiscoveryEnabled: boolean;
}

@injectable()
export class TrustController {
	constructor(
		@inject(NETWORK_TYPES.SeededTrustRankCalculator)
		private seededTrustRankCalculator: SeededTrustRankCalculator,
		@inject(NETWORK_TYPES.TrustConfigService)
		private trustConfigService: TrustConfigService,
		@inject(NETWORK_TYPES.NetworkService)
		private networkService: any // Replace with actual NetworkService type
	) {}

	/**
	 * Get seeded trust rankings for a specific organization
	 */
	async getSeededTrustRankings(
		organization: string,
		at?: string
	): Promise<SeededTrustResponse> {
		try {
			// Validate organization exists
			const organizationConfig = this.trustConfigService.getOrganizationConfig(organization);
			if (!organizationConfig) {
				throw new Error(`Organization '${organization}' not found`);
			}

			// Get network at specified time or current
			const timestamp = at ? new Date(at) : new Date();
			const network = await this.getNetworkAt(timestamp);

			// Calculate seeded trust metrics
			const result = await this.seededTrustRankCalculator.calculateSeededTrustMetrics(
				network,
				organizationConfig
			);

			// Get calculation summary
			const summary = this.seededTrustRankCalculator.getCalculationSummary(result);

			// Convert to response format
			const metrics = this.convertToNodeMetrics(result, network, organizationConfig);

			return {
				organization,
				timestamp: timestamp.toISOString(),
				metrics,
				summary: {
					...summary,
					convergenceAchieved: result.convergenceAchieved,
					iterationsUsed: result.iterationsUsed
				}
			};
		} catch (error) {
			if (error instanceof Error && error.message.includes('not found')) {
				throw error;
			}
			throw new Error(`Failed to calculate seeded trust rankings: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Get seed nodes for a specific organization
	 */
	async getOrganizationSeeds(
		organization: string
	): Promise<SeedNodesResponse> {
		try {
			const organizationConfig = this.trustConfigService.getOrganizationConfig(organization);
			if (!organizationConfig) {
				throw new Error(`Organization '${organization}' not found`);
			}

			// Get current network to validate seed nodes
			const network = await this.getNetworkAt(new Date());

			// Get all seed nodes for this organization
			const seedNodes = await this.identifyOrganizationSeeds(network, organizationConfig);

			return {
				organization,
				seeds: seedNodes
			};
		} catch (error) {
			if (error instanceof Error && error.message.includes('not found')) {
				throw error;
			}
			throw new Error(`Failed to get organization seeds: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Get list of available organizations for seeded trust
	 */
	async getAvailableOrganizations(): Promise<OrganizationsResponse> {
		try {
			const config = this.trustConfigService.getConfig();
			const organizations = this.trustConfigService.getAvailableOrganizations();

			const organizationInfos: OrganizationInfo[] = organizations.map(org => ({
				name: org.name,
				displayName: org.displayName,
				seedCount: org.seedNodes.length,
				autoDiscoveryEnabled: org.autoDiscovery?.enabled || false
			}));

			return {
				organizations: organizationInfos,
				defaultOrganization: config.defaultOrganization
			};
		} catch (error) {
			throw new Error(`Failed to get organizations: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Validate seed nodes for an organization
	 */
	async validateOrganizationSeeds(
		organization: string
	): Promise<{
		organization: string;
		validation: {
			valid: boolean;
			validSeeds: string[];
			invalidSeeds: string[];
			nonValidatorSeeds: string[];
		};
	}> {
		try {
			const organizationConfig = this.trustConfigService.getOrganizationConfig(organization);
			if (!organizationConfig) {
				throw new Error(`Organization '${organization}' not found`);
			}

			const network = await this.getNetworkAt(new Date());
			const validation = this.seededTrustRankCalculator.validateSeedNodes(
				network,
				organizationConfig.seedNodes
			);

			return {
				organization,
				validation
			};
		} catch (error) {
			if (error instanceof Error && error.message.includes('not found')) {
				throw error;
			}
			throw new Error(`Failed to validate seeds: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Get trust path between two nodes in seeded trust context
	 */
	async getTrustPath(
		organization: string,
		fromNode: string,
		toNode: string
	): Promise<{
		organization: string;
		fromNode: string;
		toNode: string;
		path: string[];
		distance: number;
		exists: boolean;
	}> {
		try {
			const organizationConfig = this.trustConfigService.getOrganizationConfig(organization);
			if (!organizationConfig) {
				throw new Error(`Organization '${organization}' not found`);
			}

			const network = await this.getNetworkAt(new Date());

			// For now, return a basic response
			// TODO: Implement actual trust path finding algorithm
			return {
				organization,
				fromNode,
				toNode,
				path: [fromNode, toNode],
				distance: 1,
				exists: false
			};
		} catch (error) {
			if (error instanceof Error && error.message.includes('not found')) {
				throw error;
			}
			throw new Error(`Failed to find trust path: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Convert seeded trust calculation result to API response format
	 */
	private convertToNodeMetrics(
		result: SeededTrustCalculationResult,
		network: Network,
		organizationConfig: OrganizationTrustConfig
	): SeededTrustNodeMetrics[] {
		const seedSet = new Set(organizationConfig.seedNodes);
		const metrics: SeededTrustNodeMetrics[] = [];

		result.seededTrustMetrics.forEach((seededMetrics, publicKey) => {
			const node = network.getNodeByPublicKey(publicKey);
			
			metrics.push({
				publicKey,
				name: node?.name || undefined,
				seededTrustCentralityScore: seededMetrics.seededTrustCentralityScore,
				seededTrustRank: seededMetrics.seededTrustRank,
				distanceFromSeeds: seededMetrics.distanceFromSeeds,
				isSeed: seedSet.has(publicKey)
			});
		});

		// Sort by seeded trust rank
		return metrics.sort((a, b) => a.seededTrustRank - b.seededTrustRank);
	}

	/**
	 * Identify seed nodes for an organization with discovery method info
	 */
	private async identifyOrganizationSeeds(
		network: Network,
		organizationConfig: OrganizationTrustConfig
	): Promise<SeedNodeInfo[]> {
		const seeds: SeedNodeInfo[] = [];

		// Add configured seed nodes
		organizationConfig.seedNodes.forEach(publicKey => {
			const node = network.getNodeByPublicKey(publicKey);
			seeds.push({
				publicKey,
				name: node?.name || undefined,
				active: node?.active || false,
				isValidator: node?.isValidator || false,
				discoveryMethod: 'configured'
			});
		});

		// TODO: Add auto-discovered seeds based on domain patterns
		// This would require implementing the auto-discovery logic

		return seeds;
	}

	/**
	 * Get network at specific timestamp
	 */
	private async getNetworkAt(timestamp: Date): Promise<Network> {
		// TODO: Implement actual network service call
		// This should get the network state at the specified timestamp
		// For now, return a placeholder
		throw new Error('Network service integration not yet implemented');
	}
}