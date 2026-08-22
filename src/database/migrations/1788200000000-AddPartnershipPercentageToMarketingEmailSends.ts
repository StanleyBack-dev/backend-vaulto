import type { MigrationInterface, QueryRunner } from "typeorm";
import { TableColumn } from "typeorm";

export class AddPartnershipPercentageToMarketingEmailSends1788200000000
  implements MigrationInterface
{
  name = "AddPartnershipPercentageToMarketingEmailSends1788200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "tb_marketing_email_sends",
      new TableColumn({
        name: "partnership_percentage",
        type: "real",
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(
      "tb_marketing_email_sends",
      "partnership_percentage",
    );
  }
}
