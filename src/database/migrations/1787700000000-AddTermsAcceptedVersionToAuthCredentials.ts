import type { MigrationInterface, QueryRunner } from "typeorm";
import { TableColumn } from "typeorm";

// Lets TermsAcceptanceGuard compare against CURRENT_TERMS_VERSION without an
// extra query — it already loads the credential row on every guarded
// request, so the version rides along on the same column set as
// terms_accepted_at instead of requiring a join to tb_terms_acceptances.
export class AddTermsAcceptedVersionToAuthCredentials1787700000000 implements MigrationInterface {
  name = "AddTermsAcceptedVersionToAuthCredentials1787700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "tb_auth_credentials",
      new TableColumn({
        name: "terms_accepted_version",
        type: "varchar",
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(
      "tb_auth_credentials",
      "terms_accepted_version",
    );
  }
}
