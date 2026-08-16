import type { MigrationInterface, QueryRunner } from "typeorm";

// Tracks when the current Pro stint began (set once when the user starts a
// trial/subscription in SubscribeToProUseCase). tb_subscriptions.created_at
// is from signup (often still on Free), so it can't be used to compute "how
// long has this user been Pro" for the cancellation notification email.
export class AddProStartedAtToSubscriptions1786700000000 implements MigrationInterface {
  name = "AddProStartedAtToSubscriptions1786700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tb_subscriptions" ADD "pro_started_at" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tb_subscriptions" DROP COLUMN "pro_started_at"`,
    );
  }
}
