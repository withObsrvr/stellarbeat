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
			const mergedQuorumSet = this.mergeQuorumSets(
				quorumSets,
				orgMap,
				'organization'
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
				'country'
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
				'isp'
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
	 * Merges multiple quorum sets into one aggregated quorum set
	 *
	 * Strategy:
	 * Use INTERSECTION-based aggregation instead of UNION to preserve trust semantics.
	 * Only include external entities that are trusted by at least threshold validators.
	 *
	 * Example:
	 *   SDF has 3 validators: sdf1, sdf2, sdf3
	 *   sdf1 trusts: {threshold: 2, validators: [sdf2, sdf3, lobstr1, blockdaemon1]}
	 *   sdf2 trusts: {threshold: 2, validators: [sdf1, sdf3, lobstr1, satoshipay1]}
	 *   sdf3 trusts: {threshold: 2, validators: [sdf1, sdf2, blockdaemon1, lobstr1]}
	 *
	 *   Old (UNION): SDF trusts ALL of {LOBSTR, Blockdaemon, SatoshiPay} ← too broad!
	 *   New (INTERSECTION): SDF trusts {LOBSTR} ← only trusted by ≥threshold(2) validators
	 *   With threshold=2, this means "need 2 of 3 SDF validators to agree on LOBSTR"
	 */
	private mergeQuorumSets(
		quorumSets: QuorumSet[],
		groupMap: Map<string, Node[]>,
		aggregationType: 'organization' | 'country' | 'isp'
	): QuorumSet {
		// Build reverse lookup: validator -> group
		const validatorToGroup = new Map<string, string>();
		groupMap.forEach((nodes, groupId) => {
			nodes.forEach((node) => {
				validatorToGroup.set(node.publicKey.value, groupId);
			});
		});

		// Count how many validators in the group trust each external entity
		const trustCounts = new Map<string, number>();

		// Process each quorum set in the group
		quorumSets.forEach((qs) => {
			// Track which entities THIS validator trusts (deduplicated)
			const trustedByThisValidator = new Set<string>();

			// Add trusted validators from the flat validators array
			qs.validators.forEach((validator: string) => {
				const group = validatorToGroup.get(validator);
				trustedByThisValidator.add(group || validator);
			});

			// Extract validators from inner quorum sets
			qs.innerQuorumSets.forEach((innerQs: QuorumSet) => {
				this.extractValidatorsFromQuorumSet(
					innerQs,
					validatorToGroup,
					trustedByThisValidator
				);
			});

			// Increment trust count for each entity trusted by this validator
			trustedByThisValidator.forEach((entity) => {
				trustCounts.set(entity, (trustCounts.get(entity) || 0) + 1);
			});
		});

		// Calculate merged threshold
		// Use majority of group size for filtering which entities to trust
		const groupSize = quorumSets.length;
		const internalConsensusThreshold = Math.ceil(groupSize / 2);

		// Only include entities trusted by at least internalConsensusThreshold validators
		// This ensures we only trust entities that the organization internally agrees on
		const validators: string[] = [];
		trustCounts.forEach((count, entity) => {
			if (count >= internalConsensusThreshold) {
				validators.push(entity);
			}
		});

		// Calculate the EXTERNAL threshold based on network size, not internal validator count
		// For network safety, we need: ⌊n/2⌋ + 1 to prevent disjoint quorums
		// Example: With 7 orgs, need 4 (not 2) to prevent splits like {A,B} and {C,D}
		const totalAvailableVotes = validators.length;
		const networkSafetyThreshold = Math.floor(totalAvailableVotes / 2) + 1;
		const threshold = Math.max(1, Math.min(networkSafetyThreshold, totalAvailableVotes));

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
		qs.validators.forEach((validator: string) => {
			const group = validatorToGroup.get(validator);
			if (group) {
				allTrustedValidators.add(group);
			} else {
				allTrustedValidators.add(validator);
			}
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
