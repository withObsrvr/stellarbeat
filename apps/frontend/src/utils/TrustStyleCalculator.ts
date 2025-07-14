import { Node } from 'shared';
import { SeededTrustMetrics } from '@/services/TrustService';
import { trustStore } from '@/store/TrustStore';

// Type for TrustStore instance
type TrustStore = typeof trustStore;

export interface TrustMetrics {
  trustCentralityScore: number;
  pageRankScore: number;
  trustRank: number;
  organizationalDiversity?: number;
  incomingTrustCount?: number;
  lastCalculation?: Date;
}

export class TrustStyleCalculator {
  /**
   * Get CSS class for node color coding based on functional state and trust view
   */
  static getTrustColorClass(
    vertex: { isFailing?: boolean; active?: boolean; overLoaded?: boolean; publicKey?: string; key?: string },
    trustStore?: TrustStore
  ): string {
    // Check failing status first (always takes precedence)
    if (vertex.isFailing) return 'node-failing';
    
    // Check node status (available on Node)
    if ('active' in vertex && !vertex.active) return 'node-inactive';
    if ('overLoaded' in vertex && vertex.overLoaded) return 'node-failing';
    
    // Enhanced for seeded view
    const nodeKey = vertex.publicKey || vertex.key;
    if (trustStore?.isSeededViewActive && nodeKey) {
      const seededMetrics = trustStore.getSeededMetrics(nodeKey);
      if (seededMetrics) {
        return this.getSeededColorClass(seededMetrics);
      }
    }
    
    // Default to active node color
    return 'node-active';
  }

  /**
   * Get warning class for node issues
   */
  static getTrustWarningClass(vertex: { isFailing?: boolean; active?: boolean; overLoaded?: boolean }): string {
    // Check failing status (available on ViewVertex)
    if (vertex.isFailing) return 'node-failing';
    
    // Check node status (available on Node)
    if ('overLoaded' in vertex && vertex.overLoaded) return 'node-failing';
    if ('active' in vertex && !vertex.active) return 'node-failing';
    
    return '';
  }

  /**
   * Get color class based on seeded trust metrics
   */
  static getSeededColorClass(seededMetrics: SeededTrustMetrics): string {
    // Color based on distance from seeds
    if (seededMetrics.distanceFromSeeds === 0) return 'node-seed';
    if (seededMetrics.distanceFromSeeds === 1) return 'node-direct-trust';
    if (seededMetrics.distanceFromSeeds === 2) return 'node-second-degree';
    if (seededMetrics.distanceFromSeeds >= 3) return 'node-distant';
    
    // Fallback to trust score for unreachable nodes
    if (seededMetrics.seededTrustCentralityScore >= 70) return 'node-high-seeded-trust';
    if (seededMetrics.seededTrustCentralityScore >= 30) return 'node-medium-seeded-trust';
    return 'node-low-seeded-trust';
  }

  /**
   * Calculate node radius based on trust score or seeded trust
   */
  static calculateNodeRadius(
    trustScore: number, 
    baseRadius: number = 8,
    seededMetrics?: SeededTrustMetrics
  ): number {
    // Use seeded radius calculation if available
    if (seededMetrics) {
      return this.calculateSeededNodeRadius(seededMetrics, baseRadius);
    }
    
    // Default global trust radius calculation
    const maxRadius = 12;
    const minRadius = 4;
    
    const normalizedScore = Math.max(0, Math.min(100, trustScore));
    const scaleFactor = normalizedScore / 100;
    
    return Math.max(minRadius, baseRadius + (maxRadius - baseRadius) * scaleFactor);
  }

  /**
   * Calculate node radius based on seeded trust metrics
   */
  static calculateSeededNodeRadius(
    seededMetrics: SeededTrustMetrics, 
    baseRadius: number = 8
  ): number {
    const maxRadius = 12;
    const minRadius = 4;
    
    // Special sizing for seed nodes
    if (seededMetrics.distanceFromSeeds === 0) {
      return maxRadius; // Seeds always max size
    }
    
    // Size based on seeded trust score
    const normalizedScore = Math.max(0, Math.min(100, seededMetrics.seededTrustCentralityScore));
    const scaleFactor = normalizedScore / 100;
    
    return Math.max(minRadius, baseRadius + (maxRadius - baseRadius) * scaleFactor);
  }

  /**
   * Get trust level description
   */
  static getTrustLevelDescription(trustScore: number): string {
    if (trustScore >= 90) return 'Exceptional Trust';
    if (trustScore >= 70) return 'High Trust';
    if (trustScore >= 50) return 'Good Trust';
    if (trustScore >= 30) return 'Medium Trust';
    if (trustScore >= 10) return 'Low Trust';
    return 'Minimal Trust';
  }

  /**
   * Get trust quality badge type
   */
  static getTrustBadgeType(node: Node, organizationalDiversity: number = 0): string {
    if (organizationalDiversity >= 5) return 'gold';
    if (organizationalDiversity >= 3) return 'silver';
    if (node.trustCentralityScore < 10) return 'warning';
    return 'none';
  }

  /**
   * Check if node has trust warnings
   */
  static hasZeroTrust(node: Node): boolean {
    return node.trustCentralityScore === 0;
  }

  static hasLowDiversity(node: Node, organizationalDiversity: number = 0): boolean {
    return organizationalDiversity < 2 && node.trustCentralityScore > 0;
  }

  static hasBelowAverageTrust(node: Node, networkAverage: number = 50): boolean {
    return node.trustCentralityScore < networkAverage && node.trustCentralityScore >= 10;
  }

  /**
   * Format trust score for display
   */
  static formatTrustScore(score: number): string {
    if (score === undefined || score === null) return 'N/A';
    return score.toFixed(1);
  }

  /**
   * Format trust rank for display
   */
  static formatTrustRank(rank: number): string {
    if (rank === undefined || rank === null) return 'N/A';
    return `#${rank}`;
  }

  /**
   * Get trust score color for progress bars
   */
  static getTrustProgressColor(trustScore: number, isSeeded: boolean = false): string {
    if (isSeeded) {
      // Seeded trust progress uses orange gradient
      if (trustScore >= 70) return '#ff6b35'; // Orange
      if (trustScore >= 50) return '#f7931e'; // Gold
      return '#1687b2'; // Blue for low scores
    }
    
    // Use original blue color for global trust progress
    return '#1687b2';
  }

  /**
   * Get node radius for graph visualization with trust store context
   */
  static getNodeRadius(
    vertex: { trustCentralityScore?: number; publicKey?: string; key?: string },
    trustStore?: TrustStore,
    baseRadius: number = 8
  ): number {
    const nodeKey = vertex.publicKey || vertex.key;
    if (trustStore?.isSeededViewActive && nodeKey) {
      const seededMetrics = trustStore.getSeededMetrics(nodeKey);
      if (seededMetrics) {
        return this.calculateSeededNodeRadius(seededMetrics, baseRadius);
      }
    }
    
    // Fallback to global trust-based sizing
    return this.calculateNodeRadius(vertex.trustCentralityScore || 0, baseRadius);
  }

  /**
   * Get distance-based description for seeded trust
   */
  static getSeededTrustDescription(seededMetrics: SeededTrustMetrics): string {
    if (seededMetrics.distanceFromSeeds === 0) {
      return 'Seed Node';
    }
    if (seededMetrics.distanceFromSeeds === 1) {
      return 'Directly Trusted';
    }
    if (seededMetrics.distanceFromSeeds === 2) {
      return 'Second Degree Trust';
    }
    if (seededMetrics.distanceFromSeeds >= 3) {
      return `${seededMetrics.distanceFromSeeds} Hops from Seeds`;
    }
    return 'Unreachable from Seeds';
  }

  /**
   * Get seeded trust level badge type
   */
  static getSeededTrustBadgeType(seededMetrics: SeededTrustMetrics): string {
    if (seededMetrics.distanceFromSeeds === 0) return 'seed';
    if (seededMetrics.distanceFromSeeds === 1) return 'direct';
    if (seededMetrics.distanceFromSeeds === 2) return 'second-degree';
    if (seededMetrics.distanceFromSeeds >= 3) return 'distant';
    return 'unreachable';
  }

  /**
   * Filter nodes by trust level (supports both global and seeded)
   */
  static filterNodesByTrust(
    nodes: Node[], 
    trustFilter: string, 
    minTrustScore: number = 0,
    trustStore?: TrustStore
  ): Node[] {
    return nodes.filter(node => {
      let trustScore = node.trustCentralityScore || 0;
      
      // Use seeded trust score if in seeded view
      if (trustStore?.isSeededViewActive) {
        const seededMetrics = trustStore.getSeededMetrics(node.publicKey);
        if (seededMetrics) {
          trustScore = seededMetrics.seededTrustCentralityScore;
        }
      }
      
      // Apply minimum trust score filter
      if (trustScore < minTrustScore) return false;
      
      // Apply trust level filter
      switch (trustFilter) {
        case 'high':
          return trustScore >= 70;
        case 'medium':
          return trustScore >= 30 && trustScore < 70;
        case 'low':
          return trustScore < 30;
        case 'seeds':
          return trustStore?.isSeedNode(node.publicKey) || false;
        case 'direct':
          return trustStore?.hasDirectTrustFromSeeds(node.publicKey) || false;
        case 'warning':
          return this.hasZeroTrust(node) || this.hasLowDiversity(node);
        case 'all':
        default:
          return true;
      }
    });
  }

  /**
   * Filter nodes by distance from seeds
   */
  static filterNodesByDistance(
    nodes: Node[],
    maxDistance: number,
    trustStore?: TrustStore
  ): Node[] {
    if (!trustStore?.isSeededViewActive) return nodes;
    
    return nodes.filter(node => {
      const seededMetrics = trustStore.getSeededMetrics(node.publicKey);
      return seededMetrics && 
             seededMetrics.distanceFromSeeds >= 0 && 
             seededMetrics.distanceFromSeeds <= maxDistance;
    });
  }

  /**
   * Sort nodes by trust metrics (supports both global and seeded)
   */
  static sortNodesByTrust(
    nodes: Node[], 
    sortBy: string, 
    sortDesc: boolean = true,
    trustStore?: TrustStore
  ): Node[] {
    return [...nodes].sort((a, b) => {
      let aValue: number;
      let bValue: number;

      // Use seeded metrics if available
      if (trustStore?.isSeededViewActive) {
        const aSeeded = trustStore.getSeededMetrics(a.publicKey);
        const bSeeded = trustStore.getSeededMetrics(b.publicKey);
        
        switch (sortBy) {
          case 'seededTrustCentralityScore':
          case 'trustCentralityScore':
            aValue = aSeeded?.seededTrustCentralityScore || 0;
            bValue = bSeeded?.seededTrustCentralityScore || 0;
            break;
          case 'seededTrustRank':
          case 'trustRank':
            aValue = aSeeded?.seededTrustRank || 999999;
            bValue = bSeeded?.seededTrustRank || 999999;
            // For rank, lower is better, so reverse the sort logic
            return sortDesc ? aValue - bValue : bValue - aValue;
          case 'distanceFromSeeds':
            aValue = aSeeded?.distanceFromSeeds ?? 999999;
            bValue = bSeeded?.distanceFromSeeds ?? 999999;
            break;
          default:
            return 0;
        }
      } else {
        // Global trust sorting
        switch (sortBy) {
          case 'trustCentralityScore':
            aValue = a.trustCentralityScore || 0;
            bValue = b.trustCentralityScore || 0;
            break;
          case 'pageRankScore':
            aValue = a.pageRankScore || 0;
            bValue = b.pageRankScore || 0;
            break;
          case 'trustRank':
            aValue = a.trustRank || 999999;
            bValue = b.trustRank || 999999;
            // For rank, lower is better, so reverse the sort logic
            return sortDesc ? aValue - bValue : bValue - aValue;
          default:
            return 0;
        }
      }

      return sortDesc ? bValue - aValue : aValue - bValue;
    });
  }
}