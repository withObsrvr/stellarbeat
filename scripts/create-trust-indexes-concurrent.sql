-- Script to create trust metric indexes concurrently (non-blocking)
-- Run this script manually after the migration has added the columns

-- Check if indexes exist before creating them
DO $$
BEGIN
    -- node_snap_shot indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'IDX_node_snap_shot_trust_centrality_score') THEN
        EXECUTE 'CREATE INDEX CONCURRENTLY IDX_node_snap_shot_trust_centrality_score ON node_snap_shot (trustCentralityScore)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'IDX_node_snap_shot_page_rank_score') THEN
        EXECUTE 'CREATE INDEX CONCURRENTLY IDX_node_snap_shot_page_rank_score ON node_snap_shot (pageRankScore)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'IDX_node_snap_shot_trust_rank') THEN
        EXECUTE 'CREATE INDEX CONCURRENTLY IDX_node_snap_shot_trust_rank ON node_snap_shot (trustRank)';
    END IF;
    
    -- node_measurement_v2 indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'IDX_node_measurement_v2_trust_centrality_score') THEN
        EXECUTE 'CREATE INDEX CONCURRENTLY IDX_node_measurement_v2_trust_centrality_score ON node_measurement_v2 (trustCentralityScore)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'IDX_node_measurement_v2_page_rank_score') THEN
        EXECUTE 'CREATE INDEX CONCURRENTLY IDX_node_measurement_v2_page_rank_score ON node_measurement_v2 (pageRankScore)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'IDX_node_measurement_v2_trust_rank') THEN
        EXECUTE 'CREATE INDEX CONCURRENTLY IDX_node_measurement_v2_trust_rank ON node_measurement_v2 (trustRank)';
    END IF;
END
$$;

-- Note: CONCURRENTLY indexes cannot be created inside a transaction block
-- You may need to run each CREATE INDEX statement separately