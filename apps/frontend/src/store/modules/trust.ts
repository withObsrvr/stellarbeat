import Vue from 'vue';
import { TrustMetrics } from '@/utils/TrustStyleCalculator';
import { TrustDataService, NetworkTrustStats } from '@/services/TrustDataService';

export interface TrustFilters {
  minTrustScore: number;
  trustLevel: 'all' | 'high' | 'medium' | 'low' | 'warning';
  showWarningsOnly: boolean;
  minOrganizationalDiversity: number;
}

export interface TrustState {
  trustMetrics: { [publicKey: string]: TrustMetrics };
  networkTrustStats: NetworkTrustStats | null;
  trustFilters: TrustFilters;
  loading: boolean;
  lastUpdated: Date | null;
  cacheStats: {
    trustCacheSize: number;
    networkStatsCached: boolean;
    lastUpdate: Date | null;
    cacheValid: boolean;
  };
}

const defaultFilters: TrustFilters = {
  minTrustScore: 0,
  trustLevel: 'all',
  showWarningsOnly: false,
  minOrganizationalDiversity: 0,
};

const state: TrustState = {
  trustMetrics: {},
  networkTrustStats: null,
  trustFilters: { ...defaultFilters },
  loading: false,
  lastUpdated: null,
  cacheStats: {
    trustCacheSize: 0,
    networkStatsCached: false,
    lastUpdate: null,
    cacheValid: false,
  },
};

const mutations = {
  SET_TRUST_METRICS(state: TrustState, { publicKey, metrics }: { publicKey: string; metrics: TrustMetrics }) {
    Vue.set(state.trustMetrics, publicKey, metrics);
  },

  SET_MULTIPLE_TRUST_METRICS(state: TrustState, metricsMap: Map<string, TrustMetrics>) {
    metricsMap.forEach((metrics, publicKey) => {
      Vue.set(state.trustMetrics, publicKey, metrics);
    });
  },

  SET_NETWORK_TRUST_STATS(state: TrustState, stats: NetworkTrustStats) {
    state.networkTrustStats = stats;
    state.lastUpdated = new Date();
  },

  SET_TRUST_FILTERS(state: TrustState, filters: Partial<TrustFilters>) {
    state.trustFilters = { ...state.trustFilters, ...filters };
  },

  RESET_TRUST_FILTERS(state: TrustState) {
    state.trustFilters = { ...defaultFilters };
  },

  SET_LOADING(state: TrustState, loading: boolean) {
    state.loading = loading;
  },

  UPDATE_CACHE_STATS(state: TrustState, stats: typeof state.cacheStats) {
    state.cacheStats = stats;
  },

  CLEAR_TRUST_DATA(state: TrustState) {
    state.trustMetrics = {};
    state.networkTrustStats = null;
    state.lastUpdated = null;
  },
};

const actions = {
  async fetchTrustMetrics({ commit }: any, publicKey: string) {
    try {
      commit('SET_LOADING', true);
      const metrics = await TrustDataService.getInstance().fetchNodeTrustMetrics(publicKey);
      commit('SET_TRUST_METRICS', { publicKey, metrics });
      
      // Update cache stats
      const cacheStats = TrustDataService.getInstance().getCacheStats();
      commit('UPDATE_CACHE_STATS', cacheStats);
    } catch (error) {
      console.error('Error fetching trust metrics:', error);
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async fetchMultipleTrustMetrics({ commit }: any, publicKeys: string[]) {
    try {
      commit('SET_LOADING', true);
      const metricsMap = await TrustDataService.getInstance().fetchMultipleNodeTrustMetrics(publicKeys);
      commit('SET_MULTIPLE_TRUST_METRICS', metricsMap);
      
      // Update cache stats
      const cacheStats = TrustDataService.getInstance().getCacheStats();
      commit('UPDATE_CACHE_STATS', cacheStats);
    } catch (error) {
      console.error('Error fetching multiple trust metrics:', error);
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async fetchNetworkTrustStats({ commit }: any) {
    try {
      commit('SET_LOADING', true);
      const stats = await TrustDataService.getInstance().fetchNetworkTrustDistribution();
      commit('SET_NETWORK_TRUST_STATS', stats);
      
      // Update cache stats
      const cacheStats = TrustDataService.getInstance().getCacheStats();
      commit('UPDATE_CACHE_STATS', cacheStats);
    } catch (error) {
      console.error('Error fetching network trust stats:', error);
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async calculateOrganizationalDiversity({ commit }: any, publicKey: string) {
    try {
      const diversity = await TrustDataService.getInstance().calculateOrganizationalDiversity(publicKey);
      
      // Update the existing trust metrics with diversity info
      const existingMetrics = state.trustMetrics[publicKey];
      if (existingMetrics) {
        const updatedMetrics = { ...existingMetrics, organizationalDiversity: diversity };
        commit('SET_TRUST_METRICS', { publicKey, metrics: updatedMetrics });
      }
      
      return diversity;
    } catch (error) {
      console.error('Error calculating organizational diversity:', error);
      return 0;
    }
  },

  updateTrustFilters({ commit }: any, filters: Partial<TrustFilters>) {
    commit('SET_TRUST_FILTERS', filters);
  },

  resetTrustFilters({ commit }: any) {
    commit('RESET_TRUST_FILTERS');
  },

  clearTrustCache({ commit }: any) {
    TrustDataService.getInstance().clearCache();
    commit('CLEAR_TRUST_DATA');
    
    // Update cache stats
    const cacheStats = TrustDataService.getInstance().getCacheStats();
    commit('UPDATE_CACHE_STATS', cacheStats);
  },

  setCacheExpiry({ commit }: any, milliseconds: number) {
    TrustDataService.getInstance().setCacheExpiry(milliseconds);
    
    // Update cache stats
    const cacheStats = TrustDataService.getInstance().getCacheStats();
    commit('UPDATE_CACHE_STATS', cacheStats);
  },
};

const getters = {
  getTrustMetrics: (state: TrustState) => (publicKey: string): TrustMetrics | null => {
    return state.trustMetrics[publicKey] || null;
  },

  getNetworkAverageTrust: (state: TrustState): number => {
    if (state.networkTrustStats) {
      return state.networkTrustStats.distribution.averageTrustScore;
    }
    
    // Calculate from cached metrics if network stats not available
    const trustScores = Object.values(state.trustMetrics)
      .map(metrics => metrics.trustCentralityScore)
      .filter(score => score > 0);
    
    if (trustScores.length === 0) return 50;
    
    return trustScores.reduce((sum, score) => sum + score, 0) / trustScores.length;
  },

  getTopTrustedNodes: (state: TrustState) => (limit: number = 10) => {
    if (state.networkTrustStats) {
      return state.networkTrustStats.distribution.topTrustedNodes.slice(0, limit);
    }
    
    // Calculate from cached metrics if network stats not available
    return Object.entries(state.trustMetrics)
      .map(([publicKey, metrics]) => ({
        publicKey,
        trustCentralityScore: metrics.trustCentralityScore,
        trustRank: metrics.trustRank,
      }))
      .sort((a, b) => b.trustCentralityScore - a.trustCentralityScore)
      .slice(0, limit);
  },

  getTrustDistribution: (state: TrustState) => {
    return state.networkTrustStats?.distribution || null;
  },

  getFilteredTrustMetrics: (state: TrustState) => {
    const { minTrustScore, trustLevel, showWarningsOnly, minOrganizationalDiversity } = state.trustFilters;
    
    return Object.entries(state.trustMetrics)
      .filter(([publicKey, metrics]) => {
        // Minimum trust score filter
        if (metrics.trustCentralityScore < minTrustScore) return false;
        
        // Trust level filter
        switch (trustLevel) {
          case 'high':
            if (metrics.trustCentralityScore < 70) return false;
            break;
          case 'medium':
            if (metrics.trustCentralityScore < 30 || metrics.trustCentralityScore >= 70) return false;
            break;
          case 'low':
            if (metrics.trustCentralityScore >= 30) return false;
            break;
          case 'warning':
            if (metrics.trustCentralityScore > 0) return false;
            break;
        }
        
        // Warning filter
        if (showWarningsOnly && metrics.trustCentralityScore > 0) return false;
        
        // Organizational diversity filter
        if (metrics.organizationalDiversity !== undefined && 
            metrics.organizationalDiversity < minOrganizationalDiversity) return false;
        
        return true;
      })
      .reduce((filtered, [publicKey, metrics]) => {
        filtered[publicKey] = metrics;
        return filtered;
      }, {} as { [publicKey: string]: TrustMetrics });
  },

  getCurrentTrustFilters: (state: TrustState): TrustFilters => {
    return state.trustFilters;
  },

  isLoading: (state: TrustState): boolean => {
    return state.loading;
  },

  getLastUpdated: (state: TrustState): Date | null => {
    return state.lastUpdated;
  },

  getCacheStats: (state: TrustState) => {
    return state.cacheStats;
  },

  isTrustDataStale: (state: TrustState): boolean => {
    if (!state.lastUpdated) return true;
    
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return state.lastUpdated < fiveMinutesAgo;
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};