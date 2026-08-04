import type { MigrationInterface, QueryRunner } from "typeorm";
import { TableColumn } from "typeorm";

export class UpdateDebtsCategoryAndDueDate1751426205000 implements MigrationInterface {
  name = "UpdateDebtsCategoryAndDueDate1751426205000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns("tb_debts", [
      new TableColumn({
        name: "category",
        type: "varchar",
        length: "80",
        isNullable: false,
        default: "'GERAL'",
      }),
      new TableColumn({
        name: "due_date",
        type: "date",
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("tb_debts", "due_date");
    await queryRunner.dropColumn("tb_debts", "category");
  }
}
