import { MigrationInterface, QueryRunner } from "typeorm";

export class DefaultMigration1766510934409 implements MigrationInterface {
    name = 'DefaultMigration1766510934409'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "product" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "description" text NOT NULL, "createdAt" datetime NOT NULL)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "product"`);
    }

}
