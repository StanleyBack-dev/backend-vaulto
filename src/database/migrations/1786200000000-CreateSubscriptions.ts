import type { MigrationInterface, QueryRunner } from "typeorm";
import { Table } from "typeorm";

export class CreateSubscriptions1786200000000 implements MigrationInterface {
  name = "CreateSubscriptions1786200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "tb_subscriptions",
        columns: [
          {
            name: "idtb_subscriptions",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            // UNIQUE also creates the index this column needs for lookups.
            name: "idtb_users",
            type: "uuid",
            isNullable: false,
            isUnique: true,
          },
          {
            name: "plan",
            type: "enum",
            enum: ["FREE", "PRO"],
            default: "'FREE'",
          },
          {
            name: "status",
            type: "enum",
            enum: ["ACTIVE", "TRIALING", "PAST_DUE", "CANCELED", "EXPIRED"],
            default: "'ACTIVE'",
          },
          {
            name: "trial_ends_at",
            type: "timestamptz",
            isNullable: true,
          },
          {
            name: "current_period_end",
            type: "timestamptz",
            isNullable: true,
          },
          {
            name: "cancel_at_period_end",
            type: "boolean",
            default: false,
          },
          {
            name: "gateway_customer_id",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "gateway_subscription_id",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "created_at",
            type: "timestamptz",
            default: "now()",
          },
          {
            name: "updated_at",
            type: "timestamptz",
            default: "now()",
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("tb_subscriptions");
  }
}
