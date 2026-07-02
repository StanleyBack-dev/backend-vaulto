import type { MigrationInterface, QueryRunner} from "typeorm";
import { Table } from "typeorm";

export class CreateAccountsTable1751426201000 implements MigrationInterface {
  name = "CreateAccountsTable1751426201000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "tb_accounts",
        columns: [
          {
            name: "idtb_accounts",
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
            name: "name",
            type: "varchar",
            length: "100",
            isNullable: false,
          },
          {
            name: "account_type",
            type: "enum",
            enum: ["CASH", "BANK", "CREDIT_CARD", "WALLET"],
            isNullable: false,
          },
          {
            name: "initial_balance",
            type: "numeric",
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: "current_balance",
            type: "numeric",
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: "is_active",
            type: "boolean",
            default: true,
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
            columnNames: ["idtb_users"],
            referencedTableName: "tb_users",
            referencedColumnNames: ["idtb_users"],
            onDelete: "CASCADE",
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("tb_accounts", true);
  }
}
