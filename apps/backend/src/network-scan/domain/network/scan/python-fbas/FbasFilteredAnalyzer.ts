/**
 * Handles filtered analysis by running analyses twice:
 * 1. Unfiltered: All nodes with valid quorum sets
 * 2. Filtered: Only validating nodes
 *
 * This matches the Rust scanner's behavior of computing blocking sets
 * with and without faulty/non-validating nodes.
 */

import { injectable } from 'inversify';
import Node from '../../../node/Node';
import { AggregatedNode } from './FbasAggregator';

export interface FilteredAnalysisInput {
	nodes: Node[];
	// Or aggregated nodes for org/country/ISP analysis
	aggregatedNodes?: AggregatedNode[];
}

export interface FilteredAnalysisResult {
	// All nodes (or aggregated nodes)
	allNodes: Node[] | AggregatedNode[];
	// Only validating nodes (or aggregated groups with at least one validating node)
	validatingNodes: Node[] | AggregatedNode[];
}

@injectable()
export class FbasFilteredAnalyzer {
	/**
	 * Splits nodes into two sets for filtered vs unfiltered analysis
	 *
	 * For regular nodes:
	 *   - All nodes with valid quorum sets
	 *   - Only validating nodes with valid quorum sets
	 *
	 * For aggregated nodes:
	 *   - All aggregated nodes
	 *   - Only aggregated nodes containing at least one validating node
	 */
	prepareFilteredAnalysis(
		input: FilteredAnalysisInput
	): FilteredAnalysisResult {
		if (input.aggregatedNodes) {
			return this.filterAggregatedNodes(input.nodes, input.aggregatedNodes);
		}

		return this.filterRegularNodes(input.nodes);
	}

	/**
	 * Filters regular nodes by validating status
	 */
	private filterRegularNodes(nodes: Node[]): FilteredAnalysisResult {
		// All nodes with valid quorum sets (already filtered by caller)
		const allNodes = nodes.filter(
			(node) => node.quorumSet && node.quorumSet.quorumSet.threshold > 0
		);

		// Only validating nodes with valid quorum sets
		const validatingNodes = allNodes.filter((node) => node.isValidating());

		return {
			allNodes,
			validatingNodes
		};
	}

	/**
	 * Filters aggregated nodes by whether they contain any validating nodes
	 *
	 * For organization/country/ISP aggregation:
	 * - "All" = all aggregated groups
	 * - "Validating" = only groups containing at least one validating node
	 */
	private filterAggregatedNodes(
		originalNodes: Node[],
		aggregatedNodes: AggregatedNode[]
	): FilteredAnalysisResult {
		// Build a set of validating node public keys for fast lookup
		const validatingNodeKeys = new Set(
			originalNodes
				.filter((node) => node.isValidating())
				.map((node) => node.publicKey.value)
		);

		// Filter aggregated nodes: keep only those with at least one validating node
		const validatingAggregatedNodes = aggregatedNodes.filter(
			(aggregatedNode) => {
				// Check if any of the original validators in this group are validating
				return aggregatedNode._originalValidators.some((validatorKey) =>
					validatingNodeKeys.has(validatorKey)
				);
			}
		);

		return {
			allNodes: aggregatedNodes,
			validatingNodes: validatingAggregatedNodes
		};
	}

	/**
	 * Validates filtered analysis results
	 * Ensures validating set is subset of all nodes
	 */
	validateFilteredResults(result: FilteredAnalysisResult): {
		valid: boolean;
		errors: string[];
	} {
		const errors: string[] = [];

		// Validating nodes should be subset of all nodes
		if (result.validatingNodes.length > result.allNodes.length) {
			errors.push(
				`Validating nodes (${result.validatingNodes.length}) exceeds all nodes (${result.allNodes.length})`
			);
		}

		// Both sets should have at least one node
		if (result.allNodes.length === 0) {
			errors.push('All nodes set is empty - cannot perform analysis');
		}

		if (result.validatingNodes.length === 0) {
			errors.push(
				'Validating nodes set is empty - filtered analysis will fail'
			);
		}

		return {
			valid: errors.length === 0,
			errors
		};
	}

	/**
	 * Gets summary of filtered analysis for logging
	 */
	getFilteredAnalysisSummary(result: FilteredAnalysisResult): {
		totalNodes: number;
		validatingNodes: number;
		filterPercentage: number;
		isAggregated: boolean;
	} {
		const totalNodes = result.allNodes.length;
		const validatingNodes = result.validatingNodes.length;
		const filterPercentage =
			totalNodes > 0
				? Math.round(((totalNodes - validatingNodes) / totalNodes) * 100 * 100) /
				  100
				: 0;

		// Check if dealing with aggregated nodes
		const isAggregated =
			result.allNodes.length > 0 && '_aggregationType' in result.allNodes[0];

		return {
			totalNodes,
			validatingNodes,
			filterPercentage,
			isAggregated
		};
	}
}
