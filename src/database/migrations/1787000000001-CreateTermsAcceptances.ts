import type { MigrationInterface, QueryRunner } from "typeorm";
import { Table, TableIndex } from "typeorm";

// Audit trail of Terms of Use / Privacy Policy acceptances: one row per
// acceptance event, never updated in place, kept for future compliance
// audits (LGPD). Records which version of the terms was accepted and the
// request's IP/user agent at that moment.
export class CreateTermsAcceptances1787000000001 implements MigrationInterface {
  name = "CreateTermsAcceptances1787000000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "tb_terms_acceptances",
        columns: [
          {
            name: "idtb_terms_acceptances",
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
            name: "terms_version",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "ip_address",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "user_agent",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "accepted_at",
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

    await queryRunner.createIndex(
      "tb_terms_acceptances",
      new TableIndex({
        name: "idx_terms_acceptances_user_id",
        columnNames: ["idtb_users"],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("tb_terms_acceptances");
  }
}
