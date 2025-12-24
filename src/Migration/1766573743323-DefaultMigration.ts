import { MigrationInterface, QueryRunner } from "typeorm";

export class DefaultMigration1766573743323 implements MigrationInterface {
    name = 'DefaultMigration1766573743323'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "entreprise" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "createdAt" datetime NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "profile" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "bio" varchar NOT NULL, "createdAt" datetime NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "post" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "createdAt" datetime NOT NULL, "authorId" integer)`);
        await queryRunner.query(`CREATE TABLE "user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "createdAt" datetime NOT NULL, "profileId" integer, CONSTRAINT "REL_9466682df91534dd95e4dbaa61" UNIQUE ("profileId"))`);
        await queryRunner.query(`CREATE TABLE "entreprise_pdg_user" ("entrepriseId" integer NOT NULL, "userId" integer NOT NULL, PRIMARY KEY ("entrepriseId", "userId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8d6cd611d06c5100b2160dd725" ON "entreprise_pdg_user" ("entrepriseId") `);
        await queryRunner.query(`CREATE INDEX "IDX_fbb2fee71309657020b9bdddbd" ON "entreprise_pdg_user" ("userId") `);
        await queryRunner.query(`CREATE TABLE "temporary_post" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "createdAt" datetime NOT NULL, "authorId" integer, CONSTRAINT "FK_c6fb082a3114f35d0cc27c518e0" FOREIGN KEY ("authorId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_post"("id", "title", "createdAt", "authorId") SELECT "id", "title", "createdAt", "authorId" FROM "post"`);
        await queryRunner.query(`DROP TABLE "post"`);
        await queryRunner.query(`ALTER TABLE "temporary_post" RENAME TO "post"`);
        await queryRunner.query(`CREATE TABLE "temporary_user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "createdAt" datetime NOT NULL, "profileId" integer, CONSTRAINT "REL_9466682df91534dd95e4dbaa61" UNIQUE ("profileId"), CONSTRAINT "FK_9466682df91534dd95e4dbaa616" FOREIGN KEY ("profileId") REFERENCES "profile" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_user"("id", "name", "createdAt", "profileId") SELECT "id", "name", "createdAt", "profileId" FROM "user"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`ALTER TABLE "temporary_user" RENAME TO "user"`);
        await queryRunner.query(`DROP INDEX "IDX_8d6cd611d06c5100b2160dd725"`);
        await queryRunner.query(`DROP INDEX "IDX_fbb2fee71309657020b9bdddbd"`);
        await queryRunner.query(`CREATE TABLE "temporary_entreprise_pdg_user" ("entrepriseId" integer NOT NULL, "userId" integer NOT NULL, CONSTRAINT "FK_8d6cd611d06c5100b2160dd7258" FOREIGN KEY ("entrepriseId") REFERENCES "entreprise" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "FK_fbb2fee71309657020b9bdddbdd" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE, PRIMARY KEY ("entrepriseId", "userId"))`);
        await queryRunner.query(`INSERT INTO "temporary_entreprise_pdg_user"("entrepriseId", "userId") SELECT "entrepriseId", "userId" FROM "entreprise_pdg_user"`);
        await queryRunner.query(`DROP TABLE "entreprise_pdg_user"`);
        await queryRunner.query(`ALTER TABLE "temporary_entreprise_pdg_user" RENAME TO "entreprise_pdg_user"`);
        await queryRunner.query(`CREATE INDEX "IDX_8d6cd611d06c5100b2160dd725" ON "entreprise_pdg_user" ("entrepriseId") `);
        await queryRunner.query(`CREATE INDEX "IDX_fbb2fee71309657020b9bdddbd" ON "entreprise_pdg_user" ("userId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_fbb2fee71309657020b9bdddbd"`);
        await queryRunner.query(`DROP INDEX "IDX_8d6cd611d06c5100b2160dd725"`);
        await queryRunner.query(`ALTER TABLE "entreprise_pdg_user" RENAME TO "temporary_entreprise_pdg_user"`);
        await queryRunner.query(`CREATE TABLE "entreprise_pdg_user" ("entrepriseId" integer NOT NULL, "userId" integer NOT NULL, PRIMARY KEY ("entrepriseId", "userId"))`);
        await queryRunner.query(`INSERT INTO "entreprise_pdg_user"("entrepriseId", "userId") SELECT "entrepriseId", "userId" FROM "temporary_entreprise_pdg_user"`);
        await queryRunner.query(`DROP TABLE "temporary_entreprise_pdg_user"`);
        await queryRunner.query(`CREATE INDEX "IDX_fbb2fee71309657020b9bdddbd" ON "entreprise_pdg_user" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_8d6cd611d06c5100b2160dd725" ON "entreprise_pdg_user" ("entrepriseId") `);
        await queryRunner.query(`ALTER TABLE "user" RENAME TO "temporary_user"`);
        await queryRunner.query(`CREATE TABLE "user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "createdAt" datetime NOT NULL, "profileId" integer, CONSTRAINT "REL_9466682df91534dd95e4dbaa61" UNIQUE ("profileId"))`);
        await queryRunner.query(`INSERT INTO "user"("id", "name", "createdAt", "profileId") SELECT "id", "name", "createdAt", "profileId" FROM "temporary_user"`);
        await queryRunner.query(`DROP TABLE "temporary_user"`);
        await queryRunner.query(`ALTER TABLE "post" RENAME TO "temporary_post"`);
        await queryRunner.query(`CREATE TABLE "post" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "createdAt" datetime NOT NULL, "authorId" integer)`);
        await queryRunner.query(`INSERT INTO "post"("id", "title", "createdAt", "authorId") SELECT "id", "title", "createdAt", "authorId" FROM "temporary_post"`);
        await queryRunner.query(`DROP TABLE "temporary_post"`);
        await queryRunner.query(`DROP INDEX "IDX_fbb2fee71309657020b9bdddbd"`);
        await queryRunner.query(`DROP INDEX "IDX_8d6cd611d06c5100b2160dd725"`);
        await queryRunner.query(`DROP TABLE "entreprise_pdg_user"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "post"`);
        await queryRunner.query(`DROP TABLE "profile"`);
        await queryRunner.query(`DROP TABLE "entreprise"`);
    }

}
