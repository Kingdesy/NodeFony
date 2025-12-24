import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration17665972579181766597258969 implements MigrationInterface {
    name = 'Migration17665972579181766597258969'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "subname" varchar NOT NULL, "createdAt" datetime NOT NULL)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "user"`);
    }

}
