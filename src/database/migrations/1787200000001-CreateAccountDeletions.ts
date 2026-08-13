import type { MigrationInterface, QueryRunner } from "typeorm";
import { Table } from "typeorm";

// Survey answers + grace-period tracking behind the "Excluir conta" flow.
export class CreateAccountDeletions1787200000001 implements MigrationInterface {
  name = "CreateAccountDeletions1787200000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "tb_account_deletions",
        columns: [
          {
            name: "idtb_account_deletions",
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
            name: "requested_at",
            type: "timestamptz",
            isNullable: false,
          },
          {
            name: "scheduled_for",
            type: "timestamptz",
            isNullable: false,
          },
          {
            name: "cancelled_at",
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
    await queryRunner.dropTable("tb_account_deletions");
  }
}
