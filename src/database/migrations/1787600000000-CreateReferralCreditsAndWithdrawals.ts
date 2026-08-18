import type { MigrationInterface, QueryRunner } from "typeorm";
import { Table } from "typeorm";

// Replaces the flat tb_referral_rewards model (one free-30-days reward per
// referrer, batched at 3 qualified referrals) with a per-referral cash
// ledger: one credit row per qualified referral, and a separate withdrawal
// request log. tb_referral_rewards is left in place (unused, harmless) —
// not dropped, to avoid a destructive migration for a table that may still
// have historical rows.
export class CreateReferralCreditsAndWithdrawals1787600000000
  implements MigrationInterface
{
  name = "CreateReferralCreditsAndWithdrawals1787600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "tb_referral_credits",
        columns: [
          {
            name: "idtb_referral_credits",
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
            name: "idtb_referred_user",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "amount_cents",
            type: "int",
            isNullable: false,
          },
          {
            name: "status",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "qualified_at",
            type: "timestamptz",
            isNullable: false,
          },
          {
            name: "available_at",
            type: "timestamptz",
            isNullable: false,
          },
          {
            name: "clawed_back_at",
            type: "timestamptz",
            isNullable: true,
          },
          {
            name: "created_at",
            type: "timestamptz",
            default: "now()",
          },
          {
            name: "updated_at",
            type: "timestamptz",
            default: "now()",
          },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: "tb_referral_withdrawals",
        columns: [
          {
            name: "idtb_referral_withdrawals",
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
            name: "amount_cents",
            type: "int",
            isNullable: false,
          },
          {
            name: "pix_key",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "pix_key_type",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "status",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "gateway_transfer_id",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "fail_reason",
            type: "text",
            isNullable: true,
          },
          {
            name: "requested_at",
            type: "timestamptz",
            isNullable: false,
          },
          {
            name: "processed_at",
            type: "timestamptz",
            isNullable: true,
          },
          {
            name: "created_at",
            type: "timestamptz",
            default: "now()",
          },
          {
            name: "updated_at",
            type: "timestamptz",
            default: "now()",
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("tb_referral_withdrawals");
    await queryRunner.dropTable("tb_referral_credits");
  }
}
