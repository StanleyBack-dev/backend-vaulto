import type { MigrationInterface, QueryRunner } from "typeorm";

// Nullable because pre-existing rows have no way to backfill the email
// without a join against tb_users at migration time; new rows always set it.
export class AddEmailToSubscriptionCancellations1787200000004 implements MigrationInterface {
  name = "AddEmailToSubscriptionCancellations1787200000004";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tb_subscription_cancellations" ADD "email" VARCHAR`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tb_subscription_cancellations" DROP COLUMN "email"`,
    );
  }
}
