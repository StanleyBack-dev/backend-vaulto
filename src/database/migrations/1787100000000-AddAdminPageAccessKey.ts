import type { MigrationInterface, QueryRunner } from "typeorm";

// The "Usuários" page is being replaced by the new general Admin page in the
// same ADMIN_MASTER-only slot (see AuthPermission/PageAccessKey changes in
// this same feature). Split into its own migration — separate from the data
// migration in 1787100000001 — because Postgres does not allow a newly added
// enum value to be used (e.g. in an UPDATE) within the same transaction that
// added it.
export class AddAdminPageAccessKey1787100000000 implements MigrationInterface {
  name = "AddAdminPageAccessKey1787100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."tb_user_page_access_page_key_enum" ADD VALUE IF NOT EXISTS 'ADMIN'`,
    );
  }

  public async down(): Promise<void> {
    // Postgres has no DROP VALUE for enum types — removing a value would
    // require recreating the type and remapping every dependent column.
    // Left as a no-op; this value is additive and harmless to keep.
  }
}
