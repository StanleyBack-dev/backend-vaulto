import type { MigrationInterface, QueryRunner } from "typeorm";
import { Table } from "typeorm";

export class CreateBillingPayments1786300000000 implements MigrationInterface {
  name = "CreateBillingPayments1786300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "tb_billing_payments",
        columns: [
          {
            name: "idtb_billing_payments",
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
            name: "gateway_payment_id",
            type: "varchar",
            isNullable: false,
            isUnique: true,
          },
          {
            name: "amount",
            type: "numeric",
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: "status",
            type: "enum",
            enum: [
              "PENDING",
              "CONFIRMED",
              "RECEIVED",
              "OVERDUE",
              "REFUNDED",
              "DELETED",
            ],
            default: "'PENDING'",
          },
          {
            name: "due_date",
            type: "date",
            isNullable: true,
          },
          {
            name: "paid_at",
            type: "timestamptz",
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
    await queryRunner.dropTable("tb_billing_payments");
  }
}
