import { DataSource } from 'typeorm';
import { TrustCentralityMetrics1751570404901 } from '../1751570404901-trust-centrality-metrics';

describe('TrustCentralityMetrics Migration', () => {
  let dataSource: DataSource;
  let migration: TrustCentralityMetrics1751570404901;

  beforeAll(async () => {
    // Setup test database connection
    dataSource = new DataSource({
      type: 'postgres',
      host: process.env.TEST_DB_HOST || 'localhost',
      port: parseInt(process.env.TEST_DB_PORT || '5432'),
      username: process.env.TEST_DB_USER || 'postgres',
      password: process.env.TEST_DB_PASSWORD || 'test',
      database: process.env.TEST_DB_NAME || 'stellarbeat_test',
      synchronize: false,
      logging: false,
    });

    await dataSource.initialize();
    migration = new TrustCentralityMetrics1751570404901();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    // Clean up before each test
    await cleanupTables();
  });

  const cleanupTables = async () => {
    const queryRunner = dataSource.createQueryRunner();
    try {
      // Drop columns if they exist
      await queryRunner.query(`ALTER TABLE "node_snap_shot" DROP COLUMN IF EXISTS "trustCentralityScore"`);
      await queryRunner.query(`ALTER TABLE "node_snap_shot" DROP COLUMN IF EXISTS "pageRankScore"`);
      await queryRunner.query(`ALTER TABLE "node_snap_shot" DROP COLUMN IF EXISTS "trustRank"`);
      await queryRunner.query(`ALTER TABLE "node_snap_shot" DROP COLUMN IF EXISTS "lastTrustCalculation"`);
      
      await queryRunner.query(`ALTER TABLE "node_measurement_v2" DROP COLUMN IF EXISTS "trustCentralityScore"`);
      await queryRunner.query(`ALTER TABLE "node_measurement_v2" DROP COLUMN IF EXISTS "pageRankScore"`);
      await queryRunner.query(`ALTER TABLE "node_measurement_v2" DROP COLUMN IF EXISTS "trustRank"`);
      await queryRunner.query(`ALTER TABLE "node_measurement_v2" DROP COLUMN IF EXISTS "lastTrustCalculation"`);
      
      // Drop indexes if they exist
      await queryRunner.query(`DROP INDEX IF EXISTS "IDX_node_snap_shot_trust_centrality_score"`);
      await queryRunner.query(`DROP INDEX IF EXISTS "IDX_node_snap_shot_page_rank_score"`);
      await queryRunner.query(`DROP INDEX IF EXISTS "IDX_node_snap_shot_trust_rank"`);
      await queryRunner.query(`DROP INDEX IF EXISTS "IDX_node_measurement_v2_trust_centrality_score"`);
      await queryRunner.query(`DROP INDEX IF EXISTS "IDX_node_measurement_v2_page_rank_score"`);
      await queryRunner.query(`DROP INDEX IF EXISTS "IDX_node_measurement_v2_trust_rank"`);
    } finally {
      await queryRunner.release();
    }
  };

  const verifyColumnsExist = async (tableName: string, expectedColumns: string[]) => {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const columns = await queryRunner.query(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_schema = 'public' 
         AND table_name = $1 
         AND column_name = ANY($2)`,
        [tableName, expectedColumns]
      );
      
      const foundColumns = columns.map((row: any) => row.column_name);
      expectedColumns.forEach(column => {
        expect(foundColumns).toContain(column);
      });
    } finally {
      await queryRunner.release();
    }
  };

  it('should create all trust metric columns on first run', async () => {
    const queryRunner = dataSource.createQueryRunner();
    
    try {
      await migration.up(queryRunner);
      
      // Verify all columns were created
      await verifyColumnsExist('node_snap_shot', [
        'trustCentralityScore',
        'pageRankScore', 
        'trustRank',
        'lastTrustCalculation'
      ]);
      
      await verifyColumnsExist('node_measurement_v2', [
        'trustCentralityScore',
        'pageRankScore',
        'trustRank', 
        'lastTrustCalculation'
      ]);
    } finally {
      await queryRunner.release();
    }
  });

  it('should be idempotent - running twice should not fail', async () => {
    const queryRunner = dataSource.createQueryRunner();
    
    try {
      // Run migration first time
      await migration.up(queryRunner);
      
      // Run migration second time - should not fail
      await expect(migration.up(queryRunner)).resolves.not.toThrow();
      
      // Verify columns still exist and are correct
      await verifyColumnsExist('node_snap_shot', [
        'trustCentralityScore',
        'pageRankScore',
        'trustRank',
        'lastTrustCalculation'
      ]);
    } finally {
      await queryRunner.release();
    }
  });

  it('should handle partial column existence gracefully', async () => {
    const queryRunner = dataSource.createQueryRunner();
    
    try {
      // Manually add some columns first
      await queryRunner.query(
        `ALTER TABLE "node_snap_shot" ADD "trustCentralityScore" decimal(12,8) DEFAULT 0`
      );
      await queryRunner.query(
        `ALTER TABLE "node_measurement_v2" ADD "pageRankScore" decimal(12,8) DEFAULT 0`
      );
      
      // Run migration - should add missing columns only
      await migration.up(queryRunner);
      
      // Verify all columns exist
      await verifyColumnsExist('node_snap_shot', [
        'trustCentralityScore',
        'pageRankScore',
        'trustRank',
        'lastTrustCalculation'
      ]);
      
      await verifyColumnsExist('node_measurement_v2', [
        'trustCentralityScore',
        'pageRankScore',
        'trustRank',
        'lastTrustCalculation'
      ]);
    } finally {
      await queryRunner.release();
    }
  });

  it('should use correct column types and defaults', async () => {
    const queryRunner = dataSource.createQueryRunner();
    
    try {
      await migration.up(queryRunner);
      
      // Check column types
      const snapShotColumns = await queryRunner.query(
        `SELECT column_name, data_type, numeric_precision, numeric_scale, column_default
         FROM information_schema.columns 
         WHERE table_schema = 'public' 
         AND table_name = 'node_snap_shot' 
         AND column_name IN ('trustCentralityScore', 'pageRankScore', 'trustRank')`
      );
      
      const trustColumn = snapShotColumns.find((col: any) => col.column_name === 'trustCentralityScore');
      expect(trustColumn.data_type).toBe('numeric');
      expect(trustColumn.numeric_precision).toBe(12);
      expect(trustColumn.numeric_scale).toBe(8);
      expect(trustColumn.column_default).toBe('0');
      
      const rankColumn = snapShotColumns.find((col: any) => col.column_name === 'trustRank');
      expect(rankColumn.data_type).toBe('integer');
      expect(rankColumn.column_default).toBe('0');
    } finally {
      await queryRunner.release();
    }
  });

  it('should successfully rollback migration', async () => {
    const queryRunner = dataSource.createQueryRunner();
    
    try {
      // Run migration up
      await migration.up(queryRunner);
      
      // Verify columns exist
      await verifyColumnsExist('node_snap_shot', ['trustCentralityScore']);
      
      // Run migration down
      await migration.down(queryRunner);
      
      // Verify columns are removed
      const columns = await queryRunner.query(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_schema = 'public' 
         AND table_name = 'node_snap_shot' 
         AND column_name = 'trustCentralityScore'`
      );
      
      expect(columns).toHaveLength(0);
    } finally {
      await queryRunner.release();
    }
  });
});