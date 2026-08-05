import type { MigrationInterface, QueryRunner } from "typeorm";
import { Table, TableColumn } from "typeorm";

export class AddCategoryTypeAndIncomes1785959648502
  implements MigrationInterface
{
  name = "AddCategoryTypeAndIncomes1785959648502";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "tb_categories",
      new TableColumn({
        name: "type",
        type: "enum",
        enum: ["EXPENSE", "INCOME"],
        default: "'EXPENSE'",
        isNullable: false,
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: "tb_incomes",
        columns: [
          {
            name: "idtb_incomes",
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
            name: "idtb_categories",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "title",
            type: "varchar",
            length: "120",
            isNullable: false,
          },
          {
            name: "description",
            type: "text",
            isNullable: true,
          },
          {
            name: "income_type",
            type: "enum",
            enum: ["FIXED", "VARIABLE"],
            isNullable: false,
          },
          {
            name: "total_amount",
            type: "numeric",
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: "start_date",
            type: "date",
            isNullable: false,
          },
          {
            name: "due_date",
            type: "date",
            isNullable: true,
          },
          {
            name: "has_installments",
            type: "boolean",
            default: false,
          },
          {
            name: "installment_count",
            type: "int",
            default: 1,
          },
          {
            name: "is_recurring",
            type: "boolean",
            default: false,
          },
          {
            name: "status",
            type: "enum",
            enum: ["PENDING", "PARTIALLY_RECEIVED", "RECEIVED", "OVERDUE"],
            default: "'PENDING'",
          },
          {
            name: "received_at",
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

    await queryRunner.createTable(
      new Table({
        name: "tb_income_installments",
        columns: [
          {
            name: "idtb_income_installments",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "idtb_incomes",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "installment_number",
            type: "int",
            isNullable: false,
          },
          {
            name: "amount_due",
            type: "numeric",
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: "amount_received",
            type: "numeric",
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: "due_date",
            type: "date",
            isNullable: false,
          },
          {
            name: "received_at",
            type: "timestamptz",
            isNullable: true,
          },
          {
            name: "status",
            type: "enum",
            enum: ["PENDING", "PARTIALLY_RECEIVED", "RECEIVED", "OVERDUE"],
            default: "'PENDING'",
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "now()",
          },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: "tb_income_receipts",
        columns: [
          {
            name: "idtb_income_receipts",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "idtb_incomes",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "idtb_income_installments",
            type: "uuid",
            isNullable: true,
          },
          {
            name: "idtb_users",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "amount_received",
            type: "numeric",
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: "received_at",
            type: "timestamptz",
            isNullable: false,
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
    await queryRunner.dropTable("tb_income_receipts");
    await queryRunner.dropTable("tb_income_installments");
    await queryRunner.dropTable("tb_incomes");
    await queryRunner.dropColumn("tb_categories", "type");
  }
}
