import type { MigrationInterface, QueryRunner } from "typeorm";
import { Table } from "typeorm";

// Audit trail of the cancellation survey answered in the cancel-subscription
// modal — also the source of truth for the internal notification email sent
// to the company (Fase: subscription cancellation survey).
export class CreateSubscriptionCancellations1786800000000 implements MigrationInterface {
  name = "CreateSubscriptionCancellations1786800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "tb_subscription_cancellations",
        columns: [
          {
            name: "idtb_subscription_cancellations",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "idtb_users",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "reasons",
            type: "varchar",
            isArray: true,
            isNullable: false,
          },
          {
            name: "other_reason",
            type: "varchar",
            length: "500",
            isNullable: true,
          },
          {
            name: "billing_cycle",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "pro_started_at",
            type: "timestamptz",
            isNullable: true,
          },
          {
            name: "requested_at",
            type: "timestamptz",
            isNullable: false,
          },
          {
            name: "effective_cancellation_at",
            type: "timestamptz",
            isNullable: true,
          },
          {
            name: "created_at",
            type: "timestamptz",
            default: "now()",
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("tb_subscription_cancellations");
  }
}
