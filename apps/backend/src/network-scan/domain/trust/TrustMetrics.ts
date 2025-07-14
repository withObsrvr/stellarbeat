export interface TrustMetrics {
	trustCentralityScore: number;
	pageRankScore: number;
	trustRank: number;
	lastTrustCalculation: Date;
}

export interface PageRankConfiguration {
	dampingFactor: number;
	maxIterations: number;
	convergenceThreshold: number;
}

export interface SeededPageRankConfiguration extends PageRankConfiguration {
	seedNodes: string[];
	seedWeight: number;
}

export interface SeededTrustMetrics extends TrustMetrics {
	seededTrustCentralityScore: number;
	seededPageRankScore: number;
	seededTrustRank: number;
	seedOrganization: string;
	distanceFromSeeds: number;
}

export const DEFAULT_PAGERANK_CONFIG: PageRankConfiguration = {
	dampingFactor: 0.85,
	maxIterations: 100,
	convergenceThreshold: 1e-6
};

export interface NodeTrustData {
	organizationId?: string | null;
	isValidator: boolean;
}

export interface TrustCalculationResult {
	trustMetrics: Map<string, TrustMetrics>;
	convergenceAchieved: boolean;
	iterationsUsed: number;
	calculationTimestamp: Date;
}

export interface SeededTrustCalculationResult {
	seededTrustMetrics: Map<string, SeededTrustMetrics>;
	convergenceAchieved: boolean;
	iterationsUsed: number;
	calculationTimestamp: Date;
	seedOrganization: string;
}