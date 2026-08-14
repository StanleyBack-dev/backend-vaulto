import type { MigrationInterface, QueryRunner } from "typeorm";
import { Table } from "typeorm";

// One row per referrer who crossed REFERRAL_QUALIFIED_COUNT_THRESHOLD
// qualified referrals — capped at one ever per user (no DB constraint for
// that; enforced in QualifyReferralUseCase before inserting).
export class CreateReferralRewards1787300000001 implements MigrationInterface {
  name = "CreateReferralRewards1787300000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "tb_referral_rewards",
        columns: [
          {
            name: "idtb_referral_rewards",
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
            name: "status",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "granted_at",
            type: "timestamptz",
            isNullable: false,
          },
          {
            name: "applied_at",
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
    await queryRunner.dropTable("tb_referral_rewards");
  }
}
