import type { MigrationInterface, QueryRunner } from "typeorm";
import { TableColumn } from "typeorm";

export class AddSocialMediaLinkToMarketingEmailSends1788300000000 implements MigrationInterface {
  name = "AddSocialMediaLinkToMarketingEmailSends1788300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "tb_marketing_email_sends",
      new TableColumn({
        name: "social_media_link",
        type: "varchar",
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(
      "tb_marketing_email_sends",
      "social_media_link",
    );
  }
}
