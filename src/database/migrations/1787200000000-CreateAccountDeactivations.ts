import type { MigrationInterface, QueryRunner } from "typeorm";
import { Table } from "typeorm";

// Survey answers behind the "Inativar conta" flow in the user's profile.
export class CreateAccountDeactivations1787200000000 implements MigrationInterface {
  name = "CreateAccountDeactivations1787200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "tb_account_deactivations",
        columns: [
          {
            name: "idtb_account_deactivations",
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
            name: "deactivated_at",
            type: "timestamptz",
            isNullable: false,
          },
          {
            name: "reactivated_at",
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
    await queryRunner.dropTable("tb_account_deactivations");
  }
}
