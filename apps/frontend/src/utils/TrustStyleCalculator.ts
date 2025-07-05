import { Node } from 'shared';

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
   * Get CSS class for trust-based color coding
   */
  static getTrustColorClass(trustScore: number): string {
    if (trustScore >= 90) return 'trust-high';
    if (trustScore >= 70) return 'trust-good';
    if (trustScore >= 50) return 'trust-medium';
    if (trustScore >= 30) return 'trust-low';
    if (trustScore >= 10) return 'trust-minimal';
    return 'trust-minimal';
  }

  /**
   * Get warning class for trust issues
   */
  static getTrustWarningClass(node: Node): string {
    if (node.trustCentralityScore === 0) return 'trust-warning';
    if (node.trustCentralityScore < 10) return 'trust-caution';
    return '';
  }

  /**
   * Calculate node radius based on trust score
   */
  static calculateNodeRadius(trustScore: number, baseRadius: number = 8): number {
    const maxRadius = 16;
    const minRadius = 4;
    
    const normalizedScore = Math.max(0, Math.min(100, trustScore));
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
  static getTrustProgressColor(trustScore: number): string {
    if (trustScore >= 90) return '#004d4d';
    if (trustScore >= 70) return '#1997c6';
    if (trustScore >= 50) return '#5bb3d6';
    if (trustScore >= 30) return '#cce7f0';
    return '#e6f3f7';
  }

  /**
   * Filter nodes by trust level
   */
  static filterNodesByTrust(nodes: Node[], trustFilter: string, minTrustScore: number = 0): Node[] {
    return nodes.filter(node => {
      const trustScore = node.trustCentralityScore || 0;
      
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
        case 'warning':
          return this.hasZeroTrust(node) || this.hasLowDiversity(node);
        case 'all':
        default:
          return true;
      }
    });
  }

  /**
   * Sort nodes by trust metrics
   */
  static sortNodesByTrust(nodes: Node[], sortBy: string, sortDesc: boolean = true): Node[] {
    return [...nodes].sort((a, b) => {
      let aValue: number;
      let bValue: number;

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

      return sortDesc ? bValue - aValue : aValue - bValue;
    });
  }
}