import type { MigrationInterface, QueryRunner } from "typeorm";

// Adds the flag that tracks whether a user has finished (or skipped) the
// in-app guided tour shown after their first successful login. Defaults to
// false so every existing credential is treated as "tour not seen yet" —
// harmless, since the frontend only opens the tour once per authenticated
// session and lets the user skip it immediately.
export class AddOnboardingTourCompletedToAuthCredentials1786100000000
  implements MigrationInterface
{
  name = "AddOnboardingTourCompletedToAuthCredentials1786100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tb_auth_credentials" ADD "onboarding_tour_completed" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tb_auth_credentials" DROP COLUMN "onboarding_tour_completed"`,
    );
  }
}
