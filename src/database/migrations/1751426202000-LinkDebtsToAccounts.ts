import type { MigrationInterface, QueryRunner } from "typeorm";
import { TableColumn, TableForeignKey } from "typeorm";

export class LinkDebtsToAccounts1751426202000 implements MigrationInterface {
  name = "LinkDebtsToAccounts1751426202000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "tb_debts",
      new TableColumn({
        name: "idtb_accounts",
        type: "uuid",
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      "tb_debts",
      new TableForeignKey({
        columnNames: ["idtb_accounts"],
        referencedTableName: "tb_accounts",
        referencedColumnNames: ["idtb_accounts"],
        onDelete: "SET NULL",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("tb_debts");
    const foreignKey = table?.foreignKeys.find((fk) =>
      fk.columnNames.includes("idtb_accounts"),
    );

    if (foreignKey) {
      await queryRunner.dropForeignKey("tb_debts", foreignKey);
    }

    await queryRunner.dropColumn("tb_debts", "idtb_accounts");
  }
}
