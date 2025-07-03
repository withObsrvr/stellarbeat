import { TrustGraph, Vertex } from 'shared';
import { PageRankConfiguration } from './TrustMetrics';

export class PageRankAlgorithm {
	/**
	 * Calculates PageRank scores for vertices in a trust graph
	 * @param trustGraph The trust graph to analyze
	 * @param config PageRank algorithm configuration
	 * @returns Map of vertex keys to their PageRank scores
	 */
	public calculatePageRank(
		trustGraph: TrustGraph,
		config: PageRankConfiguration
	): { scores: Map<string, number>; convergenceAchieved: boolean; iterationsUsed: number } {
		const vertices = Array.from(trustGraph.vertices.values());
		const numVertices = vertices.length;

		if (numVertices === 0) {
			return {
				scores: new Map(),
				convergenceAchieved: true,
				iterationsUsed: 0
			};
		}

		// Initialize PageRank scores
		const scores = new Map<string, number>();
		const newScores = new Map<string, number>();
		const initialScore = 1.0 / numVertices;

		vertices.forEach((vertex: Vertex) => {
			scores.set(vertex.key, initialScore);
			newScores.set(vertex.key, 0);
		});

		let convergenceAchieved = false;
		let iteration = 0;

		for (iteration = 0; iteration < config.maxIterations; iteration++) {
			// Reset new scores
			vertices.forEach((vertex: Vertex) => {
				newScores.set(vertex.key, 0);
			});

			// Calculate new scores
			vertices.forEach((vertex: Vertex) => {
				const parents = trustGraph.getParents(vertex);
				let incomingScore = 0;

				parents.forEach((parent: Vertex) => {
					const parentScore = scores.get(parent.key) || 0;
					const parentOutDegree = trustGraph.getChildren(parent).size;
					
					if (parentOutDegree > 0) {
						incomingScore += parentScore / parentOutDegree;
					}
				});

				const newScore = (1 - config.dampingFactor) / numVertices + 
					config.dampingFactor * incomingScore;
				newScores.set(vertex.key, newScore);
			});

			// Check for convergence
			let maxDifference = 0;
			vertices.forEach((vertex: Vertex) => {
				const oldScore = scores.get(vertex.key) || 0;
				const newScore = newScores.get(vertex.key) || 0;
				const difference = Math.abs(newScore - oldScore);
				maxDifference = Math.max(maxDifference, difference);
			});

			// Update scores
			vertices.forEach((vertex: Vertex) => {
				scores.set(vertex.key, newScores.get(vertex.key) || 0);
			});

			if (maxDifference < config.convergenceThreshold) {
				convergenceAchieved = true;
				break;
			}
		}

		return {
			scores,
			convergenceAchieved,
			iterationsUsed: iteration + 1
		};
	}

	/**
	 * Normalizes PageRank scores to a 0-100 scale
	 * @param scores Raw PageRank scores
	 * @returns Normalized scores
	 */
	public normalizeScores(scores: Map<string, number>): Map<string, number> {
		const normalizedScores = new Map<string, number>();
		
		if (scores.size === 0) {
			return normalizedScores;
		}

		const maxScore = Math.max(...Array.from(scores.values()));
		const minScore = Math.min(...Array.from(scores.values()));
		const range = maxScore - minScore;

		if (range === 0) {
			// All scores are the same
			scores.forEach((_, key) => {
				normalizedScores.set(key, 50); // Set to middle value
			});
		} else {
			scores.forEach((score, key) => {
				const normalized = ((score - minScore) / range) * 100;
				normalizedScores.set(key, normalized);
			});
		}

		return normalizedScores;
	}

	/**
	 * Creates rankings from PageRank scores (1 = highest score)
	 * @param scores PageRank scores
	 * @returns Map of vertex keys to their rank
	 */
	public createRankings(scores: Map<string, number>): Map<string, number> {
		const rankings = new Map<string, number>();
		
		// Sort vertices by score (descending)
		const sortedEntries = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]);
		
		// Assign rankings (handle ties)
		let currentRank = 1;
		let previousScore: number | null = null;
		let sameRankCount = 0;

		sortedEntries.forEach(([key, score]) => {
			if (previousScore !== null && score < previousScore) {
				currentRank += sameRankCount;
				sameRankCount = 1;
			} else {
				sameRankCount++;
			}
			
			rankings.set(key, currentRank);
			previousScore = score;
		});

		return rankings;
	}
}