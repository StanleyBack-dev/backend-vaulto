import type { MigrationInterface, QueryRunner } from "typeorm";
import { Table, TableIndex } from "typeorm";

// One row per (referrer, target email) invite email actually sent — the
// unique index is what SendReferralInviteUseCase relies on to block a
// referrer from spamming the same address twice, and doubles as a hard
// safety net at the data layer in case the application-level pre-check
// ever races (e.g. a double click).
export class CreateReferralInvites1787900000000 implements MigrationInterface {
  name = "CreateReferralInvites1787900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "tb_referral_invites",
        columns: [
          {
            name: "idtb_referral_invites",
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
            name: "target_email",
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

    await queryRunner.createIndex(
      "tb_referral_invites",
      new TableIndex({
        name: "uq_referral_invites_user_target_email",
        columnNames: ["idtb_users", "target_email"],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("tb_referral_invites");
  }
}
