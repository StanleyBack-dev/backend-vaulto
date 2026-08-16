import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddGatewayPixAuthorizationIdToSubscriptions1787400000000
  implements MigrationInterface
{
  name = "AddGatewayPixAuthorizationIdToSubscriptions1787400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tb_subscriptions" ADD "gateway_pix_authorization_id" varchar`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tb_subscriptions" DROP COLUMN "gateway_pix_authorization_id"`,
    );
  }
}
