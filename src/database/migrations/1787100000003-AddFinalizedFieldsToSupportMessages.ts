import type { MigrationInterface, QueryRunner } from "typeorm";

// Tracks who finalized a support ticket and when, so the admin ticket table
// can show "finalizado por" / "finalizado em" alongside the existing
// reply audit fields.
export class AddFinalizedFieldsToSupportMessages1787100000003 implements MigrationInterface {
  name = "AddFinalizedFieldsToSupportMessages1787100000003";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tb_support_messages" ADD "finalized_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "tb_support_messages" ADD "finalized_by_admin_id" uuid`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tb_support_messages" DROP COLUMN "finalized_by_admin_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tb_support_messages" DROP COLUMN "finalized_at"`,
    );
  }
}
