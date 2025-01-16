import {MigrationInterface, QueryRunner} from "typeorm";

export class init1636980355459 implements MigrationInterface {
    name = 'init1636980355459'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user" ("emailCipher" character varying NOT NULL, "nonce" character varying NOT NULL, "hash" character varying NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createDate" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2cbbe00f59ab6b3bb5b8d19f989" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b333676644766d2e551e2cb1ed" ON "user" ("hash") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_b333676644766d2e551e2cb1ed"`);
        await queryRunner.query(`DROP TABLE "user"`);
    }

}
