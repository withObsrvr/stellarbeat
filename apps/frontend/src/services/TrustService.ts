export interface SeededTrustMetrics {
  publicKey: string;
  name?: string;
  seededTrustCentralityScore: number;
  seededTrustRank: number;
  distanceFromSeeds: number;
  isSeed: boolean;
}

export interface SeededTrustSummary {
  totalNodes: number;
  seedNodes: number;
  reachableNodes: number;
  unreachableNodes: number;
  averageDistance: number;
  maxDistance: number;
  convergenceAchieved: boolean;
  iterationsUsed: number;
}

export interface SeededTrustResponse {
  organization: string;
  timestamp: string;
  metrics: SeededTrustMetrics[];
  summary: SeededTrustSummary;
}

export interface SeedNode {
  publicKey: string;
  name?: string;
  active: boolean;
  isValidator: boolean;
  discoveryMethod: 'configured' | 'auto-domain' | 'auto-organization';
}

export interface SeedNodesResponse {
  organization: string;
  seeds: SeedNode[];
}

export interface OrganizationInfo {
  name: string;
  displayName: string;
  seedCount: number;
  autoDiscoveryEnabled: boolean;
}

export interface OrganizationsResponse {
  organizations: OrganizationInfo[];
  defaultOrganization: string;
}

export interface TrustPathResponse {
  organization: string;
  fromNode: string;
  toNode: string;
  path: string[];
  distance: number;
  exists: boolean;
}

export interface SeedValidationResponse {
  organization: string;
  validation: {
    valid: boolean;
    validSeeds: string[];
    invalidSeeds: string[];
    nonValidatorSeeds: string[];
  };
}

export class TrustService {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/trust') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get seeded trust rankings for a specific organization
   */
  async getSeededTrustRankings(
    organization: string, 
    at?: Date
  ): Promise<SeededTrustResponse> {
    const params = new URLSearchParams();
    if (at) {
      params.append('at', at.toISOString());
    }

    const url = `${this.baseUrl}/seeded-rankings/${encodeURIComponent(organization)}${params.toString() ? '?' + params.toString() : ''}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch seeded trust rankings: ${response.status} ${errorText}`);
    }
    
    return await response.json();
  }

  /**
   * Get seed nodes for a specific organization
   */
  async getOrganizationSeeds(organization: string): Promise<SeedNodesResponse> {
    const url = `${this.baseUrl}/organizations/${encodeURIComponent(organization)}/seeds`;
    
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch organization seeds: ${response.status} ${errorText}`);
    }
    
    return await response.json();
  }

  /**
   * Get list of available organizations for seeded trust
   */
  async getAvailableOrganizations(): Promise<OrganizationsResponse> {
    const url = `${this.baseUrl}/organizations`;
    
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch organizations: ${response.status} ${errorText}`);
    }
    
    return await response.json();
  }

  /**
   * Validate seed nodes for an organization
   */
  async validateOrganizationSeeds(organization: string): Promise<SeedValidationResponse> {
    const url = `${this.baseUrl}/organizations/${encodeURIComponent(organization)}/validate-seeds`;
    
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to validate seeds: ${response.status} ${errorText}`);
    }
    
    return await response.json();
  }

  /**
   * Get trust path between two nodes in seeded trust context
   */
  async getTrustPath(
    organization: string,
    fromNode: string,
    toNode: string
  ): Promise<TrustPathResponse> {
    const url = `${this.baseUrl}/seeded-rankings/${encodeURIComponent(organization)}/path/${encodeURIComponent(fromNode)}/${encodeURIComponent(toNode)}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get trust path: ${response.status} ${errorText}`);
    }
    
    return await response.json();
  }

  /**
   * Get seeded trust metrics for a specific node
   */
  async getNodeSeededTrustMetrics(
    organization: string,
    publicKey: string,
    at?: Date
  ): Promise<SeededTrustMetrics | null> {
    const rankings = await this.getSeededTrustRankings(organization, at);
    return rankings.metrics.find(m => m.publicKey === publicKey) || null;
  }

  /**
   * Get top N nodes by seeded trust rank
   */
  async getTopSeededTrustNodes(
    organization: string,
    limit: number = 10,
    at?: Date
  ): Promise<SeededTrustMetrics[]> {
    const rankings = await this.getSeededTrustRankings(organization, at);
    return rankings.metrics
      .sort((a, b) => a.seededTrustRank - b.seededTrustRank)
      .slice(0, limit);
  }

  /**
   * Get nodes within a specific distance from seeds
   */
  async getNodesByDistanceFromSeeds(
    organization: string,
    maxDistance: number,
    at?: Date
  ): Promise<SeededTrustMetrics[]> {
    const rankings = await this.getSeededTrustRankings(organization, at);
    return rankings.metrics.filter(m => 
      m.distanceFromSeeds >= 0 && m.distanceFromSeeds <= maxDistance
    );
  }

  /**
   * Check if organization exists and is configured
   */
  async isOrganizationAvailable(organization: string): Promise<boolean> {
    try {
      const organizations = await this.getAvailableOrganizations();
      return organizations.organizations.some(org => org.name === organization);
    } catch (error) {
      console.warn(`Error checking organization availability: ${error}`);
      return false;
    }
  }

  /**
   * Get summary statistics for seeded trust calculation
   */
  async getSeededTrustSummary(
    organization: string,
    at?: Date
  ): Promise<SeededTrustSummary> {
    const rankings = await this.getSeededTrustRankings(organization, at);
    return rankings.summary;
  }
}

// Singleton instance
export const trustService = new TrustService();