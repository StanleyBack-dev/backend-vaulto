import type { MigrationInterface, QueryRunner } from "typeorm";

// Persists which billing cycle (monthly/yearly) a Pro subscription is on.
// Without this, there was no way to know how long the current paid period
// lasts, so currentPeriodEnd could never be computed after a payment
// confirmation — it was declared in the schema but never actually set.
export class AddBillingCycleToSubscriptions1786500000000 implements MigrationInterface {
  name = "AddBillingCycleToSubscriptions1786500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "tb_subscriptions_billing_cycle_enum" AS ENUM('MONTHLY', 'YEARLY')`,
    );
    await queryRunner.query(
      `ALTER TABLE "tb_subscriptions" ADD "billing_cycle" "tb_subscriptions_billing_cycle_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tb_subscriptions" DROP COLUMN "billing_cycle"`,
    );
    await queryRunner.query(`DROP TYPE "tb_subscriptions_billing_cycle_enum"`);
  }
}
