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
            name: "expected_amount",
            type: "numeric",
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: "expected_date",
            type: "date",
            isNullable: false,
          },
          {
            name: "received_amount",
            type: "numeric",
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: "received_at",
            type: "timestamptz",
            isNullable: true,
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
    await queryRunner.dropTable("tb_incomes");
    await queryRunner.dropColumn("tb_categories", "type");
  }
}
