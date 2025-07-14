import { Node } from 'shared';
import { TrustMetrics } from '@/utils/TrustStyleCalculator';

export interface TrustDistribution {
  totalNodes: number;
  averageTrustScore: number;
  medianTrustScore: number;
  giniCoefficient: number;
  distribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
  topTrustedNodes: {
    publicKey: string;
    name: string;
    trustCentralityScore: number;
    trustRank: number;
  }[];
}

export interface NetworkTrustStats {
  distribution: TrustDistribution;
  lastUpdated: Date;
  calculationTimestamp: Date;
  convergenceAchieved: boolean;
  iterationsUsed: number;
}

export class TrustDataService {
  private static instance: TrustDataService;
  private trustCache: Map<string, TrustMetrics> = new Map();
  private networkStatsCache: NetworkTrustStats | null = null;
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes
  private lastCacheUpdate: number = 0;

  static getInstance(): TrustDataService {
    if (!this.instance) {
      this.instance = new TrustDataService();
    }
    return this.instance;
  }

  /**
   * Fetch trust metrics for a specific node
   */
  async fetchNodeTrustMetrics(publicKey: string): Promise<TrustMetrics> {
    const cacheKey = publicKey;
    
    // Check cache first
    if (this.trustCache.has(cacheKey) && this.isCacheValid()) {
      return this.trustCache.get(cacheKey)!;
    }

    try {
      const response = await fetch(`/api/v1/nodes/${publicKey}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch node data: ${response.status}`);
      }

      const nodeData = await response.json();
      
      const trustMetrics: TrustMetrics = {
        trustCentralityScore: nodeData.trustCentralityScore || 0,
        pageRankScore: nodeData.pageRankScore || 0,
        trustRank: nodeData.trustRank || 0,
        organizationalDiversity: nodeData.organizationalDiversity || 0,
        incomingTrustCount: nodeData.incomingTrustCount || 0,
        lastCalculation: nodeData.lastTrustCalculation ? new Date(nodeData.lastTrustCalculation) : undefined
      };

      // Cache the result
      this.trustCache.set(cacheKey, trustMetrics);
      return trustMetrics;
    } catch (error) {
      console.error('Error fetching node trust metrics:', error);
      
      // Return default values if API fails
      return {
        trustCentralityScore: 0,
        pageRankScore: 0,
        trustRank: 0,
        organizationalDiversity: 0,
        incomingTrustCount: 0
      };
    }
  }

  /**
   * Fetch trust metrics for multiple nodes
   */
  async fetchMultipleNodeTrustMetrics(publicKeys: string[]): Promise<Map<string, TrustMetrics>> {
    const results = new Map<string, TrustMetrics>();
    const uncachedKeys: string[] = [];

    // Check cache for each key
    for (const publicKey of publicKeys) {
      if (this.trustCache.has(publicKey) && this.isCacheValid()) {
        results.set(publicKey, this.trustCache.get(publicKey)!);
      } else {
        uncachedKeys.push(publicKey);
      }
    }

    // Fetch uncached data
    if (uncachedKeys.length > 0) {
      try {
        const response = await fetch('/api/v1/nodes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ publicKeys: uncachedKeys })
        });

        if (response.ok) {
          const nodesData = await response.json();
          
          for (const nodeData of nodesData) {
            const trustMetrics: TrustMetrics = {
              trustCentralityScore: nodeData.trustCentralityScore || 0,
              pageRankScore: nodeData.pageRankScore || 0,
              trustRank: nodeData.trustRank || 0,
              organizationalDiversity: nodeData.organizationalDiversity || 0,
              incomingTrustCount: nodeData.incomingTrustCount || 0,
              lastCalculation: nodeData.lastTrustCalculation ? new Date(nodeData.lastTrustCalculation) : undefined
            };

            this.trustCache.set(nodeData.publicKey, trustMetrics);
            results.set(nodeData.publicKey, trustMetrics);
          }
        }
      } catch (error) {
        console.error('Error fetching multiple node trust metrics:', error);
      }
    }

    // Fill in any missing results with defaults
    for (const publicKey of publicKeys) {
      if (!results.has(publicKey)) {
        results.set(publicKey, {
          trustCentralityScore: 0,
          pageRankScore: 0,
          trustRank: 0,
          organizationalDiversity: 0,
          incomingTrustCount: 0
        });
      }
    }

    return results;
  }

  /**
   * Fetch network-wide trust distribution and statistics
   */
  async fetchNetworkTrustDistribution(): Promise<NetworkTrustStats> {
    // Check cache first
    if (this.networkStatsCache && this.isCacheValid()) {
      return this.networkStatsCache;
    }

    try {
      const response = await fetch('/api/v1/network/trust-distribution');
      if (!response.ok) {
        throw new Error(`Failed to fetch network trust distribution: ${response.status}`);
      }

      const data = await response.json();
      
      this.networkStatsCache = {
        distribution: data.distribution,
        lastUpdated: new Date(data.lastUpdated),
        calculationTimestamp: new Date(data.calculationTimestamp),
        convergenceAchieved: data.convergenceAchieved,
        iterationsUsed: data.iterationsUsed
      };

      this.lastCacheUpdate = Date.now();
      return this.networkStatsCache;
    } catch (error) {
      console.error('Error fetching network trust distribution:', error);
      
      // Return default values if API fails
      return {
        distribution: {
          totalNodes: 0,
          averageTrustScore: 0,
          medianTrustScore: 0,
          giniCoefficient: 0,
          distribution: [],
          topTrustedNodes: []
        },
        lastUpdated: new Date(),
        calculationTimestamp: new Date(),
        convergenceAchieved: false,
        iterationsUsed: 0
      };
    }
  }

  /**
   * Get top trusted nodes from cache or API
   */
  async getTopTrustedNodes(limit: number = 10): Promise<Array<{
    publicKey: string;
    name: string;
    trustCentralityScore: number;
    trustRank: number;
  }>> {
    const networkStats = await this.fetchNetworkTrustDistribution();
    return networkStats.distribution.topTrustedNodes.slice(0, limit);
  }

  /**
   * Calculate organizational diversity for a node based on trust connections
   */
  async calculateOrganizationalDiversity(publicKey: string): Promise<number> {
    try {
      const response = await fetch(`/api/v1/nodes/${publicKey}/trust-connections`);
      if (!response.ok) {
        return 0;
      }

      const data = await response.json();
      const uniqueOrganizations = new Set(
        data.incomingTrust.map((connection: any) => connection.organizationId).filter(Boolean)
      );
      
      return uniqueOrganizations.size;
    } catch (error) {
      console.error('Error calculating organizational diversity:', error);
      return 0;
    }
  }

  /**
   * Enhanced node filtering with trust criteria
   */
  filterNodesByTrust(
    nodes: Node[], 
    filters: {
      minTrustScore?: number;
      trustLevel?: string;
      hasWarnings?: boolean;
      minOrganizationalDiversity?: number;
    }
  ): Node[] {
    return nodes.filter(node => {
      const trustScore = node.trustCentralityScore || 0;

      // Minimum trust score filter
      if (filters.minTrustScore !== undefined && trustScore < filters.minTrustScore) {
        return false;
      }

      // Trust level filter
      if (filters.trustLevel) {
        switch (filters.trustLevel) {
          case 'high':
            if (trustScore < 70) return false;
            break;
          case 'medium':
            if (trustScore < 30 || trustScore >= 70) return false;
            break;
          case 'low':
            if (trustScore >= 30) return false;
            break;
        }
      }

      // Warning filter
      if (filters.hasWarnings && trustScore > 0) {
        return false;
      }

      return true;
    });
  }

  /**
   * Clear cache manually
   */
  clearCache(): void {
    this.trustCache.clear();
    this.networkStatsCache = null;
    this.lastCacheUpdate = 0;
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    return Date.now() - this.lastCacheUpdate < this.cacheExpiry;
  }

  /**
   * Update cache expiry time
   */
  setCacheExpiry(milliseconds: number): void {
    this.cacheExpiry = milliseconds;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    trustCacheSize: number;
    networkStatsCached: boolean;
    lastUpdate: Date | null;
    cacheValid: boolean;
  } {
    return {
      trustCacheSize: this.trustCache.size,
      networkStatsCached: this.networkStatsCache !== null,
      lastUpdate: this.lastCacheUpdate > 0 ? new Date(this.lastCacheUpdate) : null,
      cacheValid: this.isCacheValid()
    };
  }
}