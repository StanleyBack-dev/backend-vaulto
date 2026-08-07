import type { MigrationInterface, QueryRunner } from "typeorm";

// Adds the column backing Google OAuth login: a nullable, unique Google
// account id ("sub" claim) linked to a tb_auth_credentials row. Nullable
// because most existing rows are local username/password credentials with
// no Google account linked; Postgres treats multiple NULLs in a UNIQUE
// column as distinct, so the constraint only enforces uniqueness once a
// row actually links a Google account.
export class AddGoogleIdToAuthCredentials1786000000000 implements MigrationInterface {
  name = "AddGoogleIdToAuthCredentials1786000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tb_auth_credentials" ADD "google_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "tb_auth_credentials" ADD CONSTRAINT "UQ_tb_auth_credentials_google_id" UNIQUE ("google_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tb_auth_credentials" DROP CONSTRAINT "UQ_tb_auth_credentials_google_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tb_auth_credentials" DROP COLUMN "google_id"`,
    );
  }
}
