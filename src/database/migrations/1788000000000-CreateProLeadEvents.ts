import type { MigrationInterface, QueryRunner } from "typeorm";
import { Table, TableIndex } from "typeorm";

// Append-only funnel log for the Vaulto PRO subscription flow — one row per
// PLAN_CLICKED or CHECKOUT_REACHED event, read by the admin "Leads" tab.
export class CreateProLeadEvents1788000000000 implements MigrationInterface {
  name = "CreateProLeadEvents1788000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "tb_pro_lead_events",
        columns: [
          {
            name: "idtb_pro_lead_events",
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
            name: "email",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "name",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "event",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "billing_cycle",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "checkout_url",
            type: "text",
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
        ],
      }),
    );

    await queryRunner.createIndex(
      "tb_pro_lead_events",
      new TableIndex({
        name: "idx_pro_lead_events_user",
        columnNames: ["idtb_users"],
      }),
    );

    await queryRunner.createIndex(
      "tb_pro_lead_events",
      new TableIndex({
        name: "idx_pro_lead_events_event_created_at",
        columnNames: ["event", "created_at"],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("tb_pro_lead_events");
  }
}
