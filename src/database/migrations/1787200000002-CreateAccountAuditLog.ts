import type { MigrationInterface, QueryRunner } from "typeorm";
import { Table } from "typeorm";

// Minimal, permanent audit trail of account lifecycle events. Deliberately
// has no FK to tb_users — it is the one record that must survive account
// deletion, so idUsers/email/name are plain snapshot columns.
export class CreateAccountAuditLog1787200000002 implements MigrationInterface {
  name = "CreateAccountAuditLog1787200000002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "tb_account_audit_log",
        columns: [
          {
            name: "idtb_account_audit_log",
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
            name: "created_at",
            type: "timestamptz",
            default: "now()",
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("tb_account_audit_log");
  }
}
