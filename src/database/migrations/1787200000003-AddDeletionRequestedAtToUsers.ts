import type { MigrationInterface, QueryRunner } from "typeorm";

// Marks that the user has an account-deletion request pending the grace
// period (see ACCOUNT_DELETION_GRACE_PERIOD_DAYS). Read by the profile
// screen to show the "exclusão agendada" banner and by the daily
// account-deletions job to know who to process.
export class AddDeletionRequestedAtToUsers1787200000003 implements MigrationInterface {
  name = "AddDeletionRequestedAtToUsers1787200000003";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tb_users" ADD "deletion_requested_at" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tb_users" DROP COLUMN "deletion_requested_at"`,
    );
  }
}
