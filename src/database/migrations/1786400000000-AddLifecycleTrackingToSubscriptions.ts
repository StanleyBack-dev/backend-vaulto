import type { MigrationInterface, QueryRunner } from "typeorm";

// Tracks when we last warned a user their trial is ending and when a
// subscription first became PAST_DUE, so the lifecycle job (Fase 3) can
// send each reminder once and downgrade to FREE only after a grace period,
// instead of re-triggering on every run.
export class AddLifecycleTrackingToSubscriptions1786400000000 implements MigrationInterface {
  name = "AddLifecycleTrackingToSubscriptions1786400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tb_subscriptions" ADD "trial_ending_notified_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "tb_subscriptions" ADD "past_due_since" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tb_subscriptions" DROP COLUMN "past_due_since"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tb_subscriptions" DROP COLUMN "trial_ending_notified_at"`,
    );
  }
}
