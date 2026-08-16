import type { MigrationInterface, QueryRunner } from "typeorm";

// Fast-access flag mirroring onboarding_tour_completed: lets the login/session
// response tell the frontend "show the terms gate?" without an extra query.
// The actual audit trail (version, IP, user agent) lives in
// tb_terms_acceptances — this column only tracks whether the current user has
// ever accepted.
export class AddTermsAcceptedAtToAuthCredentials1787000000000 implements MigrationInterface {
  name = "AddTermsAcceptedAtToAuthCredentials1787000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tb_auth_credentials" ADD "terms_accepted_at" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tb_auth_credentials" DROP COLUMN "terms_accepted_at"`,
    );
  }
}
