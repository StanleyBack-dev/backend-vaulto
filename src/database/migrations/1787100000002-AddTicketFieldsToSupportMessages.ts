import type { MigrationInterface, QueryRunner } from "typeorm";

// Turns each support message into a trackable ticket: a human-friendly
// sequential protocol number, a status the admin can move through
// OPEN -> ANSWERED -> RESOLVED, and the admin's reply itself (text +
// who/when), so the whole exchange lives on the same row instead of a
// separate replies table — a support message gets at most one reply in this
// flow, so a child table would be premature.
export class AddTicketFieldsToSupportMessages1787100000002 implements MigrationInterface {
  name = "AddTicketFieldsToSupportMessages1787100000002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tb_support_messages" ADD "protocol_number" SERIAL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tb_support_messages" ADD "status" character varying NOT NULL DEFAULT 'OPEN'`,
    );
    await queryRunner.query(
      `ALTER TABLE "tb_support_messages" ADD "admin_reply" character varying(2000)`,
    );
    await queryRunner.query(
      `ALTER TABLE "tb_support_messages" ADD "replied_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "tb_support_messages" ADD "replied_by_admin_id" uuid`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tb_support_messages" DROP COLUMN "replied_by_admin_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tb_support_messages" DROP COLUMN "replied_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tb_support_messages" DROP COLUMN "admin_reply"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tb_support_messages" DROP COLUMN "status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tb_support_messages" DROP COLUMN "protocol_number"`,
    );
  }
}
