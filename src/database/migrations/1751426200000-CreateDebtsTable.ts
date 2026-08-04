import type { MigrationInterface, QueryRunner } from "typeorm";
import { Table } from "typeorm";

export class CreateDebtsTable1751426200000 implements MigrationInterface {
  name = "CreateDebtsTable1751426200000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "tb_debts",
        columns: [
          {
            name: "idtb_debts",
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
            name: "debt_type",
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
            name: "has_installments",
            type: "boolean",
            default: false,
            isNullable: false,
          },
          {
            name: "installment_count",
            type: "int",
            default: 1,
            isNullable: false,
          },
          {
            name: "status",
            type: "enum",
            enum: ["OPEN", "PARTIALLY_PAID", "PAID", "OVERDUE"],
            default: "'OPEN'",
            isNullable: false,
          },
          {
            name: "settled_at",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
            isNullable: false,
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            columnNames: ["idtb_users"],
            referencedTableName: "tb_users",
            referencedColumnNames: ["idtb_users"],
            onDelete: "CASCADE",
          },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: "tb_debt_payments",
        columns: [
          {
            name: "idtb_debt_payments",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "idtb_debts",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "idtb_users",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "amount_paid",
            type: "numeric",
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: "paid_at",
            type: "timestamp",
            isNullable: false,
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            columnNames: ["idtb_debts"],
            referencedTableName: "tb_debts",
            referencedColumnNames: ["idtb_debts"],
            onDelete: "CASCADE",
          },
          {
            columnNames: ["idtb_users"],
            referencedTableName: "tb_users",
            referencedColumnNames: ["idtb_users"],
            onDelete: "CASCADE",
          },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: "tb_debt_installments",
        columns: [
          {
            name: "idtb_debt_installments",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "idtb_debts",
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
            name: "amount_paid",
            type: "numeric",
            precision: 12,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: "due_date",
            type: "date",
            isNullable: false,
          },
          {
            name: "paid_at",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "status",
            type: "enum",
            enum: ["OPEN", "PARTIALLY_PAID", "PAID", "OVERDUE"],
            default: "'OPEN'",
            isNullable: false,
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
            isNullable: false,
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            columnNames: ["idtb_debts"],
            referencedTableName: "tb_debts",
            referencedColumnNames: ["idtb_debts"],
            onDelete: "CASCADE",
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("tb_debt_installments", true);
    await queryRunner.dropTable("tb_debt_payments", true);
    await queryRunner.dropTable("tb_debts", true);
  }
}
