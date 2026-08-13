import type { MigrationInterface, QueryRunner } from "typeorm";

// Any existing per-user page-access override for the old "USERS" page
// (tb_user_page_access, set via setUserPagePermissions) is migrated to the
// new "ADMIN" page key, so admins who had customized a specific user's
// access to the old Users page keep the equivalent override on the new
// Admin page. The stale 'USERS' enum value itself is left in place (see
// 1787100000000-AddAdminPageAccessKey.ts) since Postgres cannot drop it.
export class MigrateUsersPageAccessOverridesToAdmin1787100000001 implements MigrationInterface {
  name = "MigrateUsersPageAccessOverridesToAdmin1787100000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "tb_user_page_access" SET "page_key" = 'ADMIN' WHERE "page_key" = 'USERS'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "tb_user_page_access" SET "page_key" = 'USERS' WHERE "page_key" = 'ADMIN'`,
    );
  }
}
