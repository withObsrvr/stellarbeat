-- Script to create trust metric indexes concurrently (non-blocking)
-- Run this script manually after the migration has added the columns

-- Note: CONCURRENTLY indexes cannot be created inside a transaction block or DO block
-- Each statement must be run separately

-- node_snap_shot indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_node_snap_shot_trust_centrality_score" 
ON "node_snap_shot" ("trustCentralityScore");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_node_snap_shot_page_rank_score" 
ON "node_snap_shot" ("pageRankScore");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_node_snap_shot_trust_rank" 
ON "node_snap_shot" ("trustRank");

-- node_measurement_v2 indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_node_measurement_v2_trust_centrality_score" 
ON "node_measurement_v2" ("trustCentralityScore");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_node_measurement_v2_page_rank_score" 
ON "node_measurement_v2" ("pageRankScore");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_node_measurement_v2_trust_rank" 
ON "node_measurement_v2" ("trustRank");

-- Seeded trust metric indexes (added by SeededTrustMetrics migration)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_node_measurement_v2_seeded_trust_rank" 
ON "node_measurement_v2" ("seeded_trust_rank");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_node_measurement_v2_seed_organization" 
ON "node_measurement_v2" ("seed_organization");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_node_measurement_v2_distance_from_seeds" 
ON "node_measurement_v2" ("distance_from_seeds");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_node_measurement_v2_org_seeded_rank" 
ON "node_measurement_v2" ("seed_organization", "seeded_trust_rank");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_node_measurement_v2_time_org_seeded" 
ON "node_measurement_v2" ("time", "seed_organization");

-- Usage:
-- 1. Connect to your database
-- 2. Run each CREATE INDEX statement individually
-- 3. Monitor progress with: SELECT * FROM pg_stat_progress_create_index;