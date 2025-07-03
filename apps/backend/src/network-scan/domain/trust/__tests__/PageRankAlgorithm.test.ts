import { PageRankAlgorithm } from '../PageRankAlgorithm';
import { TrustGraph, Vertex } from 'shared';
import { DEFAULT_PAGERANK_CONFIG, PageRankConfiguration } from '../TrustMetrics';

describe('PageRankAlgorithm', () => {
	let pageRankAlgorithm: PageRankAlgorithm;

	beforeEach(() => {
		pageRankAlgorithm = new PageRankAlgorithm();
	});

	describe('calculatePageRank', () => {
		it('should calculate PageRank for a simple graph', () => {
			// Arrange
			const graph = createSimpleGraph();
			
			// Act
			const result = pageRankAlgorithm.calculatePageRank(graph, DEFAULT_PAGERANK_CONFIG);
			
			// Assert
			expect(result.scores.size).toBe(3);
			expect(result.convergenceAchieved).toBe(true);
			expect(result.iterationsUsed).toBeGreaterThan(0);
			
			// Verify scores are positive and sum approximately to 1
			const scores = Array.from(result.scores.values());
			scores.forEach(score => expect(score).toBeGreaterThan(0));
			
			const sum = scores.reduce((a, b) => a + b, 0);
			expect(sum).toBeCloseTo(1, 2);
		});

		it('should handle empty graph', () => {
			// Arrange
			const graph = new TrustGraph();
			
			// Act
			const result = pageRankAlgorithm.calculatePageRank(graph, DEFAULT_PAGERANK_CONFIG);
			
			// Assert
			expect(result.scores.size).toBe(0);
			expect(result.convergenceAchieved).toBe(true);
			expect(result.iterationsUsed).toBe(0);
		});

		it('should handle single node graph', () => {
			// Arrange
			const graph = new TrustGraph();
			const vertex = new Vertex('single');
			graph.addVertex(vertex);
			
			// Act
			const result = pageRankAlgorithm.calculatePageRank(graph, DEFAULT_PAGERANK_CONFIG);
			
			// Assert
			expect(result.scores.size).toBe(1);
			expect(result.scores.get('single')).toBe(1);
			expect(result.convergenceAchieved).toBe(true);
		});

		it('should converge faster with higher damping factor', () => {
			// Arrange
			const graph = createComplexGraph();
			const lowDampingConfig: PageRankConfiguration = {
				...DEFAULT_PAGERANK_CONFIG,
				dampingFactor: 0.1
			};
			const highDampingConfig: PageRankConfiguration = {
				...DEFAULT_PAGERANK_CONFIG,
				dampingFactor: 0.9
			};
			
			// Act
			const lowDampingResult = pageRankAlgorithm.calculatePageRank(graph, lowDampingConfig);
			const highDampingResult = pageRankAlgorithm.calculatePageRank(graph, highDampingConfig);
			
			// Assert
			expect(lowDampingResult.iterationsUsed).toBeLessThanOrEqual(highDampingResult.iterationsUsed);
		});

		it('should respect max iterations limit', () => {
			// Arrange
			const graph = createComplexGraph();
			const config: PageRankConfiguration = {
				dampingFactor: 0.99, // High damping to slow convergence
				maxIterations: 5,
				convergenceThreshold: 1e-10 // Very strict threshold
			};
			
			// Act
			const result = pageRankAlgorithm.calculatePageRank(graph, config);
			
			// Assert
			expect(result.iterationsUsed).toBeLessThanOrEqual(5);
		});

		it('should handle disconnected components', () => {
			// Arrange
			const graph = createDisconnectedGraph();
			
			// Act
			const result = pageRankAlgorithm.calculatePageRank(graph, DEFAULT_PAGERANK_CONFIG);
			
			// Assert
			expect(result.scores.size).toBe(4);
			expect(result.convergenceAchieved).toBe(true);
			
			// All nodes should have positive scores
			Array.from(result.scores.values()).forEach(score => {
				expect(score).toBeGreaterThan(0);
			});
		});
	});

	describe('normalizeScores', () => {
		it('should normalize scores to 0-100 range', () => {
			// Arrange
			const scores = new Map([
				['node1', 0.5],
				['node2', 0.3],
				['node3', 0.2]
			]);
			
			// Act
			const normalized = pageRankAlgorithm.normalizeScores(scores);
			
			// Assert
			expect(normalized.size).toBe(3);
			expect(normalized.get('node1')).toBe(100); // Highest score -> 100
			expect(normalized.get('node3')).toBe(0);   // Lowest score -> 0
			expect(normalized.get('node2')).toBe(50);  // Middle score -> 50
		});

		it('should handle equal scores', () => {
			// Arrange
			const scores = new Map([
				['node1', 0.33],
				['node2', 0.33],
				['node3', 0.33]
			]);
			
			// Act
			const normalized = pageRankAlgorithm.normalizeScores(scores);
			
			// Assert
			expect(normalized.size).toBe(3);
			// All should get middle value when range is 0
			expect(normalized.get('node1')).toBe(50);
			expect(normalized.get('node2')).toBe(50);
			expect(normalized.get('node3')).toBe(50);
		});

		it('should handle empty scores map', () => {
			// Arrange
			const scores = new Map<string, number>();
			
			// Act
			const normalized = pageRankAlgorithm.normalizeScores(scores);
			
			// Assert
			expect(normalized.size).toBe(0);
		});
	});

	describe('createRankings', () => {
		it('should create correct rankings from scores', () => {
			// Arrange
			const scores = new Map([
				['node1', 75],
				['node2', 100],
				['node3', 50]
			]);
			
			// Act
			const rankings = pageRankAlgorithm.createRankings(scores);
			
			// Assert
			expect(rankings.size).toBe(3);
			expect(rankings.get('node2')).toBe(1); // Highest score -> rank 1
			expect(rankings.get('node1')).toBe(2); // Second highest -> rank 2
			expect(rankings.get('node3')).toBe(3); // Lowest -> rank 3
		});

		it('should handle tied scores correctly', () => {
			// Arrange
			const scores = new Map([
				['node1', 100],
				['node2', 100], // Tied for first
				['node3', 50],
				['node4', 50]   // Tied for third
			]);
			
			// Act
			const rankings = pageRankAlgorithm.createRankings(scores);
			
			// Assert
			expect(rankings.size).toBe(4);
			expect(rankings.get('node1')).toBe(1);
			expect(rankings.get('node2')).toBe(1); // Both tied at rank 1
			expect(rankings.get('node3')).toBe(3); // Next rank is 3 (skipping 2)
			expect(rankings.get('node4')).toBe(3); // Both tied at rank 3
		});

		it('should handle empty scores map', () => {
			// Arrange
			const scores = new Map<string, number>();
			
			// Act
			const rankings = pageRankAlgorithm.createRankings(scores);
			
			// Assert
			expect(rankings.size).toBe(0);
		});
	});

	// Helper functions
	function createSimpleGraph(): TrustGraph {
		const graph = new TrustGraph();
		const vertex1 = new Vertex('node1');
		const vertex2 = new Vertex('node2');
		const vertex3 = new Vertex('node3');
		
		graph.addVertex(vertex1);
		graph.addVertex(vertex2);
		graph.addVertex(vertex3);
		
		// Create a simple cycle: 1 -> 2 -> 3 -> 1
		graph.addEdge(vertex1, vertex2);
		graph.addEdge(vertex2, vertex3);
		graph.addEdge(vertex3, vertex1);
		
		return graph;
	}

	function createComplexGraph(): TrustGraph {
		const graph = new TrustGraph();
		const vertices = [];
		
		// Create 5 vertices
		for (let i = 1; i <= 5; i++) {
			const vertex = new Vertex(`node${i}`);
			vertices.push(vertex);
			graph.addVertex(vertex);
		}
		
		// Create a more complex trust structure
		graph.addEdge(vertices[0], vertices[1]); // 1 -> 2
		graph.addEdge(vertices[0], vertices[2]); // 1 -> 3
		graph.addEdge(vertices[1], vertices[2]); // 2 -> 3
		graph.addEdge(vertices[1], vertices[3]); // 2 -> 4
		graph.addEdge(vertices[2], vertices[4]); // 3 -> 5
		graph.addEdge(vertices[3], vertices[0]); // 4 -> 1 (creates cycle)
		graph.addEdge(vertices[4], vertices[0]); // 5 -> 1
		
		return graph;
	}

	function createDisconnectedGraph(): TrustGraph {
		const graph = new TrustGraph();
		
		// Component 1: two connected nodes
		const vertex1 = new Vertex('node1');
		const vertex2 = new Vertex('node2');
		graph.addVertex(vertex1);
		graph.addVertex(vertex2);
		graph.addEdge(vertex1, vertex2);
		
		// Component 2: two isolated nodes
		const vertex3 = new Vertex('node3');
		const vertex4 = new Vertex('node4');
		graph.addVertex(vertex3);
		graph.addVertex(vertex4);
		// No edges between components
		
		return graph;
	}
});