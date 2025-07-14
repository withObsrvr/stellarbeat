import { ref, computed, reactive } from 'vue';
import { 
  trustService, 
  SeededTrustMetrics, 
  SeededTrustSummary, 
  SeedNode, 
  OrganizationInfo 
} from '@/services/TrustService';

export type TrustViewMode = 'global' | 'seeded';

export interface TrustStoreState {
  viewMode: TrustViewMode;
  selectedOrganization: string;
  seededMetrics: Map<string, SeededTrustMetrics>;
  seedNodes: SeedNode[];
  organizations: OrganizationInfo[];
  summary: SeededTrustSummary | null;
  isLoading: boolean;
  lastUpdated: Date | null;
  error: string | null;
}

class TrustStore {
  private state = reactive<TrustStoreState>({
    viewMode: 'global' as TrustViewMode,
    selectedOrganization: 'obsrvr',
    seededMetrics: new Map(),
    seedNodes: [],
    organizations: [],
    summary: null,
    isLoading: false,
    lastUpdated: null,
    error: null
  });

  // Computed properties
  get viewMode(): TrustViewMode {
    return this.state.viewMode;
  }

  get selectedOrganization(): string {
    return this.state.selectedOrganization;
  }

  get isLoading(): boolean {
    return this.state.isLoading;
  }

  get error(): string | null {
    return this.state.error;
  }

  get lastUpdated(): Date | null {
    return this.state.lastUpdated;
  }

  get summary(): SeededTrustSummary | null {
    return this.state.summary;
  }

  get organizations(): OrganizationInfo[] {
    return this.state.organizations;
  }

  get seedNodes(): SeedNode[] {
    return this.state.seedNodes;
  }

  get availableOrganizations(): { name: string; displayName: string }[] {
    return this.state.organizations.map(org => ({
      name: org.name,
      displayName: org.displayName
    }));
  }

  get isSeededViewActive(): boolean {
    return this.state.viewMode === 'seeded';
  }

  get hasSeededData(): boolean {
    return this.state.seededMetrics.size > 0;
  }

  get seedNodePublicKeys(): Set<string> {
    return new Set(this.state.seedNodes.map(seed => seed.publicKey));
  }

  // Actions
  async initialize(): Promise<void> {
    try {
      this.state.isLoading = true;
      this.state.error = null;

      // Load available organizations
      const organizationsResponse = await trustService.getAvailableOrganizations();
      this.state.organizations = organizationsResponse.organizations;
      
      // Set default organization if not already set
      if (!this.state.selectedOrganization || 
          !this.state.organizations.find(org => org.name === this.state.selectedOrganization)) {
        this.state.selectedOrganization = organizationsResponse.defaultOrganization;
      }

      // Load initial seeded data for default organization
      if (this.state.viewMode === 'seeded') {
        await this.loadSeededTrustData();
      }
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : 'Failed to initialize trust store';
      console.error('Trust store initialization failed:', error);
    } finally {
      this.state.isLoading = false;
    }
  }

  setViewMode(mode: TrustViewMode): void {
    if (this.state.viewMode === mode) return;
    
    this.state.viewMode = mode;
    this.state.error = null;

    // Load seeded data when switching to seeded view
    if (mode === 'seeded' && !this.hasSeededData) {
      this.loadSeededTrustData();
    }
  }

  async selectOrganization(organization: string): Promise<void> {
    if (this.state.selectedOrganization === organization) return;

    this.state.selectedOrganization = organization;
    this.state.error = null;

    // Clear existing seeded data when changing organizations
    this.clearSeededData();

    // Load new data if in seeded view
    if (this.state.viewMode === 'seeded') {
      await this.loadSeededTrustData();
    }
  }

  async loadSeededTrustData(at?: Date): Promise<void> {
    try {
      this.state.isLoading = true;
      this.state.error = null;

      // Load seeded trust rankings and seed nodes in parallel
      const [seededResponse, seedsResponse] = await Promise.all([
        trustService.getSeededTrustRankings(this.state.selectedOrganization, at),
        trustService.getOrganizationSeeds(this.state.selectedOrganization)
      ]);

      // Update state
      this.state.seededMetrics = new Map(
        seededResponse.metrics.map(m => [m.publicKey, m])
      );
      this.state.seedNodes = seedsResponse.seeds;
      this.state.summary = seededResponse.summary;
      this.state.lastUpdated = new Date();

    } catch (error) {
      this.state.error = error instanceof Error ? error.message : 'Failed to load seeded trust data';
      console.error('Failed to load seeded trust data:', error);
    } finally {
      this.state.isLoading = false;
    }
  }

  async refreshSeededData(): Promise<void> {
    if (this.state.viewMode === 'seeded') {
      await this.loadSeededTrustData();
    }
  }

  clearSeededData(): void {
    this.state.seededMetrics.clear();
    this.state.seedNodes = [];
    this.state.summary = null;
    this.state.lastUpdated = null;
  }

  clearError(): void {
    this.state.error = null;
  }

  // Getters for specific data
  getSeededMetrics(publicKey: string): SeededTrustMetrics | null {
    return this.state.seededMetrics.get(publicKey) || null;
  }

  isSeedNode(publicKey: string): boolean {
    return this.seedNodePublicKeys.has(publicKey);
  }

  hasDirectTrustFromSeeds(publicKey: string): boolean {
    const metrics = this.getSeededMetrics(publicKey);
    return metrics?.distanceFromSeeds === 1;
  }

  getNodesByDistance(distance: number): SeededTrustMetrics[] {
    return Array.from(this.state.seededMetrics.values())
      .filter(m => m.distanceFromSeeds === distance)
      .sort((a, b) => a.seededTrustRank - b.seededTrustRank);
  }

  getTopSeededNodes(limit: number = 10): SeededTrustMetrics[] {
    return Array.from(this.state.seededMetrics.values())
      .sort((a, b) => a.seededTrustRank - b.seededTrustRank)
      .slice(0, limit);
  }

  getSeededMetricsArray(): SeededTrustMetrics[] {
    return Array.from(this.state.seededMetrics.values());
  }

  // Validation helpers
  async validateCurrentOrganization(): Promise<boolean> {
    try {
      const isAvailable = await trustService.isOrganizationAvailable(this.state.selectedOrganization);
      if (!isAvailable) {
        this.state.error = `Organization '${this.state.selectedOrganization}' is not available`;
      }
      return isAvailable;
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : 'Failed to validate organization';
      return false;
    }
  }

  // Statistics helpers
  getDistanceDistribution(): { distance: number; count: number }[] {
    const distribution = new Map<number, number>();
    
    this.state.seededMetrics.forEach(metrics => {
      const distance = metrics.distanceFromSeeds;
      if (distance >= 0) {
        distribution.set(distance, (distribution.get(distance) || 0) + 1);
      }
    });

    return Array.from(distribution.entries())
      .map(([distance, count]) => ({ distance, count }))
      .sort((a, b) => a.distance - b.distance);
  }

  getTrustScoreDistribution(buckets: number = 10): { min: number; max: number; count: number }[] {
    const scores = Array.from(this.state.seededMetrics.values())
      .map(m => m.seededTrustCentralityScore)
      .filter(score => score > 0);

    if (scores.length === 0) return [];

    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const bucketSize = (maxScore - minScore) / buckets;

    const distribution: { min: number; max: number; count: number }[] = [];

    for (let i = 0; i < buckets; i++) {
      const min = minScore + i * bucketSize;
      const max = i === buckets - 1 ? maxScore : min + bucketSize;
      const count = scores.filter(score => score >= min && score <= max).length;
      
      distribution.push({ min, max, count });
    }

    return distribution;
  }
}

// Create singleton instance
export const trustStore = new TrustStore();

// Composable for Vue components
export function useTrustStore() {
  return trustStore;
}