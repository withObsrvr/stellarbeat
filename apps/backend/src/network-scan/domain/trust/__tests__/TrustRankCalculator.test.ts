import { TrustRankCalculator } from '../TrustRankCalculator';
import { PageRankAlgorithm } from '../PageRankAlgorithm';
import { TrustGraph, Vertex, Edge, StronglyConnectedComponentsFinder, NetworkTransitiveQuorumSetFinder } from 'shared';
import { NodeTrustData, DEFAULT_PAGERANK_CONFIG } from '../TrustMetrics';

describe('TrustRankCalculator', () => {
	let trustRankCalculator: TrustRankCalculator;
	let mockPageRankAlgorithm: jest.Mocked<PageRankAlgorithm>;

	beforeEach(() => {
		trustRankCalculator = new TrustRankCalculator();
		// Replace the internal PageRank algorithm with a mock
		mockPageRankAlgorithm = {
			calculatePageRank: jest.fn(),
			normalizeScores: jest.fn(),
			createRankings: jest.fn(),
			calculateSeededPageRank: jest.fn(),
			calculateDistanceFromSeeds: jest.fn()
		} as jest.Mocked<PageRankAlgorithm>;
		(trustRankCalculator as any).pageRankAlgorithm = mockPageRankAlgorithm;
	});

	describe('calculateTrustMetrics', () => {
		it('should calculate trust metrics for a simple network', () => {
			// Arrange
			const trustGraph = createSimpleTrustGraph();
			const nodeData = createSimpleNodeData();
			
			const mockPageRankScores = new Map([
				['node1', 0.4],
				['node2', 0.3],
				['node3', 0.3]
			]);
			
			const mockNormalizedScores = new Map([
				['node1', 100],
				['node2', 75],
				['node3', 50]
			]);
			
			const mockRankings = new Map([
				['node1', 1],
				['node2', 2],
				['node3', 3]
			]);

			mockPageRankAlgorithm.calculatePageRank.mockReturnValue({
				scores: mockPageRankScores,
				convergenceAchieved: true,
				iterationsUsed: 10
			});
			mockPageRankAlgorithm.normalizeScores
				.mockReturnValueOnce(mockNormalizedScores) // First call for PageRank normalization
				.mockReturnValueOnce(mockNormalizedScores); // Second call for trust centrality normalization
			mockPageRankAlgorithm.createRankings.mockReturnValue(mockRankings);

			// Act
			const result = trustRankCalculator.calculateTrustMetrics(trustGraph, nodeData);

			// Assert
			expect(result.trustMetrics.size).toBe(3);
			expect(result.convergenceAchieved).toBe(true);
			expect(result.iterationsUsed).toBe(10);
			expect(result.calculationTimestamp).toBeInstanceOf(Date);

			const node1Metrics = result.trustMetrics.get('node1');
			expect(node1Metrics).toBeDefined();
			expect(node1Metrics!.pageRankScore).toBe(100);
			expect(node1Metrics!.trustRank).toBe(1);
			expect(node1Metrics!.lastTrustCalculation).toBeInstanceOf(Date);
		});

		it('should use default configuration when none provided', () => {
			// Arrange
			const trustGraph = createSimpleTrustGraph();
			const nodeData = createSimpleNodeData();
			
			mockPageRankAlgorithm.calculatePageRank.mockReturnValue({
				scores: new Map(),
				convergenceAchieved: true,
				iterationsUsed: 1
			});
			mockPageRankAlgorithm.normalizeScores.mockReturnValue(new Map());
			mockPageRankAlgorithm.createRankings.mockReturnValue(new Map());

			// Act
			trustRankCalculator.calculateTrustMetrics(trustGraph, nodeData);

			// Assert
			expect(mockPageRankAlgorithm.calculatePageRank).toHaveBeenCalledWith(
				trustGraph,
				DEFAULT_PAGERANK_CONFIG
			);
		});

		it('should apply organizational diversity bonuses', () => {
			// Arrange
			const trustGraph = createDiverseTrustGraph();
			const nodeData = createDiverseNodeData();
			
			const mockPageRankScores = new Map([
				['node1', 0.33],
				['node2', 0.33],
				['node3', 0.34]
			]);
			
			const mockNormalizedScores = new Map([
				['node1', 50],
				['node2', 50],
				['node3', 50]
			]);

			mockPageRankAlgorithm.calculatePageRank.mockReturnValue({
				scores: mockPageRankScores,
				convergenceAchieved: true,
				iterationsUsed: 5
			});
			mockPageRankAlgorithm.normalizeScores
				.mockReturnValueOnce(mockNormalizedScores)
				.mockReturnValueOnce(new Map([
					['node1', 100], // Should get highest score due to organizational diversity
					['node2', 75],
					['node3', 50]
				]));
			mockPageRankAlgorithm.createRankings.mockReturnValue(new Map([
				['node1', 1],
				['node2', 2],
				['node3', 3]
			]));

			// Act
			const result = trustRankCalculator.calculateTrustMetrics(trustGraph, nodeData);

			// Assert
			const node1Metrics = result.trustMetrics.get('node1');
			expect(node1Metrics!.trustCentralityScore).toBe(100);
			
			// Verify that trust centrality normalization was called
			expect(mockPageRankAlgorithm.normalizeScores).toHaveBeenCalledTimes(2);
		});

		it('should apply validator bonuses', () => {
			// Arrange
			const trustGraph = createSimpleTrustGraph();
			const nodeData = new Map<string, NodeTrustData>([
				['node1', { organizationId: 'org1', isValidator: true }],
				['node2', { organizationId: 'org2', isValidator: false }],
				['node3', { organizationId: 'org3', isValidator: false }]
			]);
			
			const mockPageRankScores = new Map([
				['node1', 0.33],
				['node2', 0.33],
				['node3', 0.34]
			]);
			
			const mockNormalizedScores = new Map([
				['node1', 50],
				['node2', 50],
				['node3', 50]
			]);

			mockPageRankAlgorithm.calculatePageRank.mockReturnValue({
				scores: mockPageRankScores,
				convergenceAchieved: true,
				iterationsUsed: 5
			});
			mockPageRankAlgorithm.normalizeScores
				.mockReturnValueOnce(mockNormalizedScores)
				.mockReturnValueOnce(new Map([
					['node1', 100], // Validator should get higher score
					['node2', 75],
					['node3', 50]
				]));
			mockPageRankAlgorithm.createRankings.mockReturnValue(new Map([
				['node1', 1],
				['node2', 2],
				['node3', 3]
			]));

			// Act
			const result = trustRankCalculator.calculateTrustMetrics(trustGraph, nodeData);

			// Assert
			const node1Metrics = result.trustMetrics.get('node1');
			expect(node1Metrics!.trustCentralityScore).toBe(100);
		});

		it('should handle empty trust graph', () => {
			// Arrange
			const trustGraph = new TrustGraph(
				new StronglyConnectedComponentsFinder(),
				new NetworkTransitiveQuorumSetFinder()
			);
			const nodeData = new Map<string, NodeTrustData>();
			
			mockPageRankAlgorithm.calculatePageRank.mockReturnValue({
				scores: new Map(),
				convergenceAchieved: true,
				iterationsUsed: 0
			});
			mockPageRankAlgorithm.normalizeScores.mockReturnValue(new Map());
			mockPageRankAlgorithm.createRankings.mockReturnValue(new Map());

			// Act
			const result = trustRankCalculator.calculateTrustMetrics(trustGraph, nodeData);

			// Assert
			expect(result.trustMetrics.size).toBe(0);
			expect(result.convergenceAchieved).toBe(true);
			expect(result.iterationsUsed).toBe(0);
		});

		it('should handle nodes without organization data', () => {
			// Arrange
			const trustGraph = createSimpleTrustGraph();
			const nodeData = new Map<string, NodeTrustData>([
				['node1', { organizationId: null, isValidator: false }],
				['node2', { organizationId: undefined, isValidator: true }]
			]);
			
			const mockPageRankScores = new Map([
				['node1', 0.5],
				['node2', 0.5],
				['node3', 0.0]
			]);
			
			const mockNormalizedScores = new Map([
				['node1', 75],
				['node2', 75],
				['node3', 0]
			]);

			mockPageRankAlgorithm.calculatePageRank.mockReturnValue({
				scores: mockPageRankScores,
				convergenceAchieved: true,
				iterationsUsed: 3
			});
			mockPageRankAlgorithm.normalizeScores
				.mockReturnValueOnce(mockNormalizedScores)
				.mockReturnValueOnce(mockNormalizedScores);
			mockPageRankAlgorithm.createRankings.mockReturnValue(new Map([
				['node1', 2],
				['node2', 1],
				['node3', 3]
			]));

			// Act
			const result = trustRankCalculator.calculateTrustMetrics(trustGraph, nodeData);

			// Assert
			expect(result.trustMetrics.size).toBe(3);
			
			const node1Metrics = result.trustMetrics.get('node1');
			const node2Metrics = result.trustMetrics.get('node2');
			
			expect(node1Metrics).toBeDefined();
			expect(node2Metrics).toBeDefined();
			
			// Node2 should have higher score due to validator bonus
			expect(node2Metrics!.trustRank).toBe(1);
		});
	});

	// Helper functions
	function createSimpleTrustGraph(): TrustGraph {
		const graph = new TrustGraph(
			new StronglyConnectedComponentsFinder(),
			new NetworkTransitiveQuorumSetFinder()
		);
		const vertex1 = new Vertex('node1', 'Node 1', 1);
		const vertex2 = new Vertex('node2', 'Node 2', 1);
		const vertex3 = new Vertex('node3', 'Node 3', 1);
		
		graph.addVertex(vertex1);
		graph.addVertex(vertex2);
		graph.addVertex(vertex3);
		
		// Create some trust relationships
		graph.addEdge(new Edge(vertex1, vertex2));
		graph.addEdge(new Edge(vertex1, vertex3));
		graph.addEdge(new Edge(vertex2, vertex3));
		
		return graph;
	}

	function createSimpleNodeData(): Map<string, NodeTrustData> {
		return new Map([
			['node1', { organizationId: 'org1', isValidator: true }],
			['node2', { organizationId: 'org2', isValidator: true }],
			['node3', { organizationId: 'org3', isValidator: false }]
		]);
	}

	function createDiverseTrustGraph(): TrustGraph {
		const graph = new TrustGraph(
			new StronglyConnectedComponentsFinder(),
			new NetworkTransitiveQuorumSetFinder()
		);
		const vertex1 = new Vertex('node1', 'Node 1', 1);
		const vertex2 = new Vertex('node2', 'Node 2', 1);
		const vertex3 = new Vertex('node3', 'Node 3', 1);
		const vertex4 = new Vertex('node4', 'Node 4', 1);
		
		graph.addVertex(vertex1);
		graph.addVertex(vertex2);
		graph.addVertex(vertex3);
		graph.addVertex(vertex4);
		
		// Node1 receives trust from multiple organizations
		graph.addEdge(new Edge(vertex2, vertex1)); // org2 -> org1
		graph.addEdge(new Edge(vertex3, vertex1)); // org3 -> org1
		graph.addEdge(new Edge(vertex4, vertex1)); // org4 -> org1
		
		// Node2 receives trust from single organization
		graph.addEdge(new Edge(vertex3, vertex2)); // org3 -> org2
		graph.addEdge(new Edge(vertex4, vertex2)); // org4 -> org2 (same as node3's org)
		
		return graph;
	}

	function createDiverseNodeData(): Map<string, NodeTrustData> {
		return new Map([
			['node1', { organizationId: 'org1', isValidator: true }],
			['node2', { organizationId: 'org2', isValidator: true }],
			['node3', { organizationId: 'org3', isValidator: true }],
			['node4', { organizationId: 'org3', isValidator: true }] // Same org as node3
		]);
	}
});