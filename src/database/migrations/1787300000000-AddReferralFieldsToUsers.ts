import type { MigrationInterface, QueryRunner } from "typeorm";

// referral_code is nullable (not backfilled for existing users): it's
// generated lazily the first time a user checks their referral stats, or
// eagerly for every account created from here on — see CreateUserUseCase /
// LoginWithGoogleUseCase. A UNIQUE constraint on a nullable column is fine
// in Postgres: it only rejects duplicate non-null values.
export class AddReferralFieldsToUsers1787300000000 implements MigrationInterface {
  name = "AddReferralFieldsToUsers1787300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tb_users" ADD "referral_code" VARCHAR`,
    );
    await queryRunner.query(
      `ALTER TABLE "tb_users" ADD CONSTRAINT "UQ_tb_users_referral_code" UNIQUE ("referral_code")`,
    );
    await queryRunner.query(
      `ALTER TABLE "tb_users" ADD "referred_by_user_id" UUID`,
    );
    await queryRunner.query(
      `ALTER TABLE "tb_users" ADD "referral_qualified_at" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tb_users" DROP COLUMN "referral_qualified_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tb_users" DROP COLUMN "referred_by_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tb_users" DROP CONSTRAINT "UQ_tb_users_referral_code"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tb_users" DROP COLUMN "referral_code"`,
    );
  }
}
