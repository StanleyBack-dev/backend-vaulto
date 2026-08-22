import type { MigrationInterface, QueryRunner } from "typeorm";
import { Table, TableIndex } from "typeorm";

// One row per partner/influencer outreach email actually sent. The
// (recipient_email, created_at) index backs SendMarketingEmailUseCase's
// 7-day cooldown lookup (find the most recent send for that address) and
// the admin history list's default sort.
export class CreateMarketingEmailSends1788100000000 implements MigrationInterface {
  name = "CreateMarketingEmailSends1788100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "tb_marketing_email_sends",
        columns: [
          {
            name: "idtb_marketing_email_sends",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "category",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "recipient_email",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "recipient_name",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "recipient_phone",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "subject",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "body_markdown",
            type: "text",
            isNullable: false,
          },
          {
            name: "sent_by_admin_id",
            type: "uuid",
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
      "tb_marketing_email_sends",
      new TableIndex({
        name: "idx_marketing_email_sends_recipient_email_created_at",
        columnNames: ["recipient_email", "created_at"],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("tb_marketing_email_sends");
  }
}
