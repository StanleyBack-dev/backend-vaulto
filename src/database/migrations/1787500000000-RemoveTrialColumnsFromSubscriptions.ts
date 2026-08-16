import type { MigrationInterface, QueryRunner } from "typeorm";

// The 7-day trial flow was removed — every plan now charges immediately and
// activates Pro on payment confirmation, so trial_ends_at and
// trial_ending_notified_at are no longer written or read anywhere. Safe to
// drop outright since no production data depends on them yet.
export class RemoveTrialColumnsFromSubscriptions1787500000000 implements MigrationInterface {
  name = "RemoveTrialColumnsFromSubscriptions1787500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tb_subscriptions" DROP COLUMN "trial_ends_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tb_subscriptions" DROP COLUMN "trial_ending_notified_at"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tb_subscriptions" ADD "trial_ends_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "tb_subscriptions" ADD "trial_ending_notified_at" TIMESTAMP WITH TIME ZONE`,
    );
  }
}
