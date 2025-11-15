/**
 * Aggregates FBAS nodes by organization, country, or ISP
 * Replaces Rust scanner's built-in MergeBy functionality
 *
 * This is critical for removing the tier 1 organization cap that limits Rust scanner
 */

import { injectable } from 'inversify';
import Node from '../../../node/Node';
import Organization from '../../../organization/Organization';
import { QuorumSet } from 'shared';

export interface AggregatedNode {
	publicKey: string; // Group identifier (org ID, country name, ISP name)
	name: string | null;
	quorumSet: QuorumSet | null;
	geoData: {
		countryName: string | null;
	} | null;
	isp: string | null;
	// Track original validators for result mapping
	_originalValidators: string[];
	_aggregationType: 'organization' | 'country' | 'isp';
}

export enum AggregationType {
	ORGANIZATION = 'organization',
	COUNTRY = 'country',
	ISP = 'isp'
}

@injectable()
export class FbasAggregator {
	/**
	 * Aggregate nodes by organization
	 * Groups all validators from same organization into single "super node"
	 */
	aggregateByOrganization(
		nodes: Node[],
		organizations: Organization[]
	): AggregatedNode[] {
		const aggregated: AggregatedNode[] = [];

		// Group nodes by organization
		const orgMap = new Map<string, Node[]>();

		// Create a map of validator public key to organization
		const validatorToOrg = new Map<string, Organization>();
		organizations.forEach((org) => {
			org.validators.value.forEach((validator) => {
				validatorToOrg.set(validator.value, org);
			});
		});

		// Group nodes by their organization
		nodes.forEach((node) => {
			const org = validatorToOrg.get(node.publicKey.value);
			if (org) {
				const orgId = org.organizationId.value;
				if (!orgMap.has(orgId)) {
					orgMap.set(orgId, []);
				}
				orgMap.get(orgId)!.push(node);
			}
		});

		// Create aggregated node for each organization
		orgMap.forEach((orgNodes, orgId) => {
			const org = organizations.find((o) => o.organizationId.value === orgId);
			const orgName = org?.name || orgId;

			// Collect all quorum sets from org's validators
			const quorumSets = orgNodes
				.map((n) => n.quorumSet?.quorumSet)
				.filter((qs): qs is QuorumSet => qs !== null && qs !== undefined);

			if (quorumSets.length === 0) {
				// Skip organizations with no valid quorum sets
				return;
			}

			// Merge quorum sets - create union of trust relationships
			const mergedQuorumSet = this.mergeQuorumSetsForOrganizations(
				quorumSets,
				validatorToOrg, // Pass ALL organizations for complete validator mapping
				orgId // Pass current org ID for self-reference
			);

			aggregated.push({
				publicKey: orgId,
				name: orgName,
				quorumSet: mergedQuorumSet,
				geoData: null,
				isp: null,
				_originalValidators: orgNodes.map((n) => n.publicKey.value),
				_aggregationType: 'organization'
			});
		});

		return aggregated;
	}

	/**
	 * Aggregate nodes by country
	 * Groups all validators from same country into single "super node"
	 */
	aggregateByCountry(nodes: Node[]): AggregatedNode[] {
		const aggregated: AggregatedNode[] = [];

		// Group nodes by country
		const countryMap = new Map<string, Node[]>();

		nodes.forEach((node) => {
			const country = node.geoData?.countryName || 'Unknown';
			if (!countryMap.has(country)) {
				countryMap.set(country, []);
			}
			countryMap.get(country)!.push(node);
		});

		// Create aggregated node for each country
		countryMap.forEach((countryNodes, country) => {
			const quorumSets = countryNodes
				.map((n) => n.quorumSet?.quorumSet)
				.filter((qs): qs is QuorumSet => qs !== null && qs !== undefined);

			if (quorumSets.length === 0) {
				return;
			}

			const mergedQuorumSet = this.mergeQuorumSets(
				quorumSets,
				countryMap,
				'country',
				country // Pass current country for self-reference
			);

			aggregated.push({
				publicKey: country,
				name: country,
				quorumSet: mergedQuorumSet,
				geoData: {
					countryName: country
				},
				isp: null,
				_originalValidators: countryNodes.map((n) => n.publicKey.value),
				_aggregationType: 'country'
			});
		});

		return aggregated;
	}

	/**
	 * Aggregate nodes by ISP
	 * Groups all validators from same ISP into single "super node"
	 */
	aggregateByISP(nodes: Node[]): AggregatedNode[] {
		const aggregated: AggregatedNode[] = [];

		// Group nodes by ISP
		const ispMap = new Map<string, Node[]>();

		nodes.forEach((node) => {
			const isp = node.isp || 'Unknown';
			if (!ispMap.has(isp)) {
				ispMap.set(isp, []);
			}
			ispMap.get(isp)!.push(node);
		});

		// Create aggregated node for each ISP
		ispMap.forEach((ispNodes, isp) => {
			const quorumSets = ispNodes
				.map((n) => n.quorumSet?.quorumSet)
				.filter((qs): qs is QuorumSet => qs !== null && qs !== undefined);

			if (quorumSets.length === 0) {
				return;
			}

			const mergedQuorumSet = this.mergeQuorumSets(
				quorumSets,
				ispMap,
				'isp',
				isp // Pass current ISP for self-reference
			);

			aggregated.push({
				publicKey: isp,
				name: isp,
				quorumSet: mergedQuorumSet,
				geoData: null,
				isp: isp,
				_originalValidators: ispNodes.map((n) => n.publicKey.value),
				_aggregationType: 'isp'
			});
		});

		return aggregated;
	}

	/**
	 * Merges multiple quorum sets for organization aggregation
	 *
	 * Uses validator-to-organization map to properly resolve all trust relationships
	 */
	private mergeQuorumSetsForOrganizations(
		quorumSets: QuorumSet[],
		validatorToOrg: Map<string, Organization>,
		currentGroupId: string // ID of the group we're building the QS for
	): QuorumSet {
		// Build reverse lookup: validator -> group (organization ID)
		const validatorToGroup = new Map<string, string>();
		validatorToOrg.forEach((org, validatorKey) => {
			validatorToGroup.set(validatorKey, org.organizationId.value);
		});

		// Collect ALL entities trusted by ANY validator (UNION)
		const allTrustedEntities = new Set<string>();

		// Process each quorum set in the group
		quorumSets.forEach((qs) => {
			// Add trusted validators from the flat validators array
			qs.validators.forEach((validator: string) => {
				const group = validatorToGroup.get(validator);
				if (group) {
					allTrustedEntities.add(group);
				}
				// Silently skip unmapped validators - they create asymmetric trust
			});

			// Extract validators from inner quorum sets
			qs.innerQuorumSets.forEach((innerQs: QuorumSet) => {
				this.extractValidatorsFromQuorumSet(
					innerQs,
					validatorToGroup,
					allTrustedEntities
				);
			});
		});

		// Always include self-reference for aggregated groups
		// This ensures the group always trusts itself (critical for FBAS analysis)
		allTrustedEntities.add(currentGroupId);

		// Convert to array
		const validators = Array.from(allTrustedEntities);

		// Calculate threshold: average of individual validator thresholds
		// This better preserves the original trust requirements
		const avgThreshold = quorumSets.reduce((sum, qs) => sum + qs.threshold, 0) / quorumSets.length;
		const threshold = Math.max(1, Math.ceil(avgThreshold));

		console.log(`[FbasAggregator] Merged QS for ${currentGroupId}: threshold=${threshold}, validators=${validators.length}, originalThresholds=${quorumSets.map(qs => qs.threshold).join(',')}`);

		return new QuorumSet(threshold, validators, []);
	}

	/**
	 * Merges multiple quorum sets for country/ISP aggregation
	 *
	 * Uses group map (country/ISP -> nodes) to build validator-to-group mapping
	 */
	private mergeQuorumSets(
		quorumSets: QuorumSet[],
		groupMap: Map<string, Node[]>,
		aggregationType: 'country' | 'isp',
		currentGroupId: string // ID of the group we're building the QS for
	): QuorumSet {
		// Build reverse lookup: validator -> group
		const validatorToGroup = new Map<string, string>();
		groupMap.forEach((nodes, groupId) => {
			nodes.forEach((node) => {
				validatorToGroup.set(node.publicKey.value, groupId);
			});
		});

		// Collect ALL entities trusted by ANY validator (UNION)
		const allTrustedEntities = new Set<string>();

		// Process each quorum set in the group
		quorumSets.forEach((qs) => {
			// Add trusted validators from the flat validators array
			qs.validators.forEach((validator: string) => {
				const group = validatorToGroup.get(validator);
				if (group) {
					allTrustedEntities.add(group);
				}
				// Silently skip unmapped validators - they create asymmetric trust
			});

			// Extract validators from inner quorum sets
			qs.innerQuorumSets.forEach((innerQs: QuorumSet) => {
				this.extractValidatorsFromQuorumSet(
					innerQs,
					validatorToGroup,
					allTrustedEntities
				);
			});
		});

		// Always include self-reference for aggregated groups
		// This ensures the group always trusts itself (critical for FBAS analysis)
		allTrustedEntities.add(currentGroupId);

		// Convert to array
		const validators = Array.from(allTrustedEntities);

		// Calculate threshold: average of individual validator thresholds
		// This better preserves the original trust requirements
		const avgThreshold = quorumSets.reduce((sum, qs) => sum + qs.threshold, 0) / quorumSets.length;
		const threshold = Math.max(1, Math.ceil(avgThreshold));

		console.log(`[FbasAggregator] Merged QS for ${currentGroupId}: threshold=${threshold}, validators=${validators.length}, originalThresholds=${quorumSets.map(qs => qs.threshold).join(',')}`);

		return new QuorumSet(threshold, validators, []);
	}

	/**
	 * Recursively extracts all validators from a quorum set and adds them to the trusted set
	 * This handles the case where Stellar nodes put trust in innerQuorumSets instead of validators array
	 */
	private extractValidatorsFromQuorumSet(
		qs: QuorumSet,
		validatorToGroup: Map<string, string>,
		allTrustedValidators: Set<string>
	): void {
		// Add validators from this QS
		// Only include mapped validators (ignore unmapped individual validators)
		qs.validators.forEach((validator: string) => {
			const group = validatorToGroup.get(validator);
			if (group) {
				allTrustedValidators.add(group);
			}
			// Silently skip unmapped validators - they create asymmetric trust
		});

		// Recursively process inner quorum sets
		qs.innerQuorumSets.forEach((innerQs: QuorumSet) => {
			this.extractValidatorsFromQuorumSet(innerQs, validatorToGroup, allTrustedValidators);
		});
	}

	/**
	 * Maps validators in a quorum set to their aggregated groups
	 */
	private mapQuorumSetValidators(
		qs: QuorumSet,
		validatorToGroup: Map<string, string>
	): QuorumSet {
		const mappedValidators = qs.validators.map((validator: string) => {
			const group = validatorToGroup.get(validator);
			return group || validator;
		});

		const mappedInnerQs = qs.innerQuorumSets.map((innerQs) =>
			this.mapQuorumSetValidators(innerQs, validatorToGroup)
		);

		return new QuorumSet(
			qs.threshold,
			Array.from(new Set(mappedValidators)), // Deduplicate
			mappedInnerQs
		);
	}

	/**
	 * Deduplicates quorum sets based on structure
	 */
	private deduplicateQuorumSets(quorumSets: QuorumSet[]): QuorumSet[] {
		const seen = new Set<string>();
		const unique: QuorumSet[] = [];

		quorumSets.forEach((qs) => {
			const key = this.quorumSetToKey(qs);
			if (!seen.has(key)) {
				seen.add(key);
				unique.push(qs);
			}
		});

		return unique;
	}

	/**
	 * Creates a string key for quorum set deduplication
	 */
	private quorumSetToKey(qs: QuorumSet): string {
		const validators = Array.from(qs.validators).sort().join(',');
		const innerKeys = qs.innerQuorumSets
			.map((inner) => this.quorumSetToKey(inner))
			.sort()
			.join('|');
		return `${qs.threshold}:${validators}:${innerKeys}`;
	}

	/**
	 * Validates aggregated nodes before analysis
	 */
	validateAggregatedNodes(nodes: AggregatedNode[]): {
		valid: boolean;
		errors: string[];
	} {
		const errors: string[] = [];

		nodes.forEach((node, index) => {
			if (!node.publicKey) {
				errors.push(`Node ${index} missing publicKey`);
			}

			if (!node.quorumSet) {
				errors.push(`Node ${node.publicKey} missing quorumSet`);
			} else {
				if (node.quorumSet.threshold <= 0) {
					errors.push(
						`Node ${node.publicKey} has invalid threshold: ${node.quorumSet.threshold}`
					);
				}

				if (
					node.quorumSet.validators.length === 0 &&
					node.quorumSet.innerQuorumSets.length === 0
				) {
					errors.push(`Node ${node.publicKey} has empty quorum set`);
				}
			}

			if (
				!node._originalValidators ||
				node._originalValidators.length === 0
			) {
				errors.push(
					`Node ${node.publicKey} missing original validator tracking`
				);
			}
		});

		return {
			valid: errors.length === 0,
			errors
		};
	}

	/**
	 * Gets aggregation summary for logging
	 */
	getAggregationSummary(
		originalNodes: Node[],
		aggregatedNodes: AggregatedNode[],
		type: AggregationType
	): {
		originalCount: number;
		aggregatedCount: number;
		reductionPercentage: number;
		type: string;
		averageGroupSize: number;
	} {
		const reduction =
			((originalNodes.length - aggregatedNodes.length) /
				originalNodes.length) *
			100;
		const avgGroupSize = originalNodes.length / aggregatedNodes.length;

		return {
			originalCount: originalNodes.length,
			aggregatedCount: aggregatedNodes.length,
			reductionPercentage: Math.round(reduction * 100) / 100,
			type,
			averageGroupSize: Math.round(avgGroupSize * 100) / 100
		};
	}
}
