import type { MigrationInterface, QueryRunner } from "typeorm";

// DEBTS_STATEMENT, INCOMES and INCOME_RECEIPTS were added to the
// PageAccessKey TS enum by earlier commits, but none of them added a
// matching migration to extend the Postgres enum type backing
// tb_user_page_access.page_key. In development that gap is invisible
// because `synchronize: true` recreates the type from the entity on every
// boot, but production only runs migrations, so any query touching one of
// these values (e.g. loading a user's page permissions, which filters by
// `page_key IN (...ALL_PAGE_ACCESS_KEYS)`) fails with
// "invalid input value for enum tb_user_page_access_page_key_enum".
export class AddMissingPageAccessKeys1785974526849 implements MigrationInterface {
  name = "AddMissingPageAccessKeys1785974526849";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."tb_user_page_access_page_key_enum" ADD VALUE IF NOT EXISTS 'DEBTS_STATEMENT'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."tb_user_page_access_page_key_enum" ADD VALUE IF NOT EXISTS 'INCOMES'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."tb_user_page_access_page_key_enum" ADD VALUE IF NOT EXISTS 'INCOME_RECEIPTS'`,
    );
  }

  public async down(): Promise<void> {
    // Postgres has no DROP VALUE for enum types — removing a value would
    // require recreating the type and remapping every dependent column.
    // Left as a no-op; these values are additive and harmless to keep.
  }
}
