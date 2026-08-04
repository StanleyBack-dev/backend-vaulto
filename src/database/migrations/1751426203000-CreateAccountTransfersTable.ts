import type { MigrationInterface, QueryRunner } from "typeorm";
import { Table } from "typeorm";

export class CreateAccountTransfersTable1751426203000 implements MigrationInterface {
  name = "CreateAccountTransfersTable1751426203000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "tb_account_transfers",
        columns: [
          {
            name: "idtb_account_transfers",
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
            name: "idtb_source_accounts",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "idtb_destination_accounts",
            type: "uuid",
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
            name: "transferred_at",
            type: "timestamp",
            isNullable: false,
            default: "CURRENT_TIMESTAMP",
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
            columnNames: ["idtb_users"],
            referencedTableName: "tb_users",
            referencedColumnNames: ["idtb_users"],
            onDelete: "CASCADE",
          },
          {
            columnNames: ["idtb_source_accounts"],
            referencedTableName: "tb_accounts",
            referencedColumnNames: ["idtb_accounts"],
            onDelete: "CASCADE",
          },
          {
            columnNames: ["idtb_destination_accounts"],
            referencedTableName: "tb_accounts",
            referencedColumnNames: ["idtb_accounts"],
            onDelete: "CASCADE",
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("tb_account_transfers", true);
  }
}
