import type { MigrationInterface, QueryRunner } from "typeorm";
import { Table } from "typeorm";

export class CreateTransactionsTable1751426204000 implements MigrationInterface {
  name = "CreateTransactionsTable1751426204000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "tb_transactions",
        columns: [
          {
            name: "idtb_transactions",
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
            name: "idtb_accounts",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "transaction_type",
            type: "enum",
            enum: ["INCOME", "EXPENSE"],
            isNullable: false,
          },
          {
            name: "amount",
            type: "numeric",
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: "description",
            type: "text",
            isNullable: true,
          },
          {
            name: "occurred_at",
            type: "timestamp",
            isNullable: false,
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "created_at",
            type: "timestamp",
            isNullable: false,
            default: "CURRENT_TIMESTAMP",
          },
        ],
        foreignKeys: [
          {
            columnNames: ["idtb_users"],
            referencedTableName: "tb_users",
            referencedColumnNames: ["idtb_users"],
            onDelete: "CASCADE",
          },
          {
            columnNames: ["idtb_accounts"],
            referencedTableName: "tb_accounts",
            referencedColumnNames: ["idtb_accounts"],
            onDelete: "CASCADE",
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("tb_transactions", true);
  }
}
