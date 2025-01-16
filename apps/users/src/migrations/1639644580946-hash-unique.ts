import {MigrationInterface, QueryRunner} from "typeorm";

export class hashUnique1639644580946 implements MigrationInterface {
    name = 'hashUnique1639644580946'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_b333676644766d2e551e2cb1ed"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e282acb94d2e3aec10f480e4f6" ON "user" ("hash") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_e282acb94d2e3aec10f480e4f6"`);
        await queryRunner.query(`CREATE INDEX "IDX_b333676644766d2e551e2cb1ed" ON "user" ("hash") `);
    }

}
