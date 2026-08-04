import type { MigrationInterface, QueryRunner } from "typeorm";
import { Table, TableColumn, TableForeignKey } from "typeorm";

export class CreateCategoriesAndLinkDebts1751426207000 implements MigrationInterface {
  name = "CreateCategoriesAndLinkDebts1751426207000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "tb_categories",
        columns: [
          {
            name: "idtb_categories",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "idtb_users",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "name",
            type: "varchar",
            length: "80",
            isNullable: false,
          },
          {
            name: "status",
            type: "boolean",
            default: true,
            isNullable: false,
          },
          {
            name: "inactivated_at",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
            isNullable: false,
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            columnNames: ["idtb_users"],
            referencedTableName: "tb_users",
            referencedColumnNames: ["idtb_users"],
            onDelete: "CASCADE",
          },
        ],
      }),
    );

    await queryRunner.addColumn(
      "tb_debts",
      new TableColumn({
        name: "idtb_categories",
        type: "uuid",
        isNullable: true,
      }),
    );

    await queryRunner.query(`
      INSERT INTO "tb_categories" ("idtb_users", "name", "status")
      SELECT DISTINCT d."idtb_users", d."category"::text, true
      FROM "tb_debts" d
      WHERE d."category" IS NOT NULL;
    `);

    await queryRunner.query(`
      UPDATE "tb_debts" d
      SET "idtb_categories" = c."idtb_categories"
      FROM "tb_categories" c
      WHERE c."idtb_users" = d."idtb_users"
        AND c."name" = d."category"::text;
    `);

    await queryRunner.query(`
      DELETE FROM "tb_categories" c
      WHERE c."idtb_categories" IN (
        SELECT c2."idtb_categories"
        FROM "tb_categories" c2
        JOIN "tb_categories" c3
          ON c2."idtb_users" = c3."idtb_users"
         AND LOWER(c2."name") = LOWER(c3."name")
         AND c2."idtb_categories" > c3."idtb_categories"
      );
    `);

    await queryRunner.query(`
      ALTER TABLE "tb_debts"
      ALTER COLUMN "idtb_categories" SET NOT NULL;
    `);

    await queryRunner.createForeignKey(
      "tb_debts",
      new TableForeignKey({
        columnNames: ["idtb_categories"],
        referencedTableName: "tb_categories",
        referencedColumnNames: ["idtb_categories"],
        onDelete: "RESTRICT",
      }),
    );

    await queryRunner.query(`
      ALTER TABLE "tb_debts" DROP COLUMN "category";
    `);

    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."tb_debts_category_enum";`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "tb_debts",
      new TableColumn({
        name: "category",
        type: "varchar",
        length: "80",
        isNullable: true,
      }),
    );

    await queryRunner.query(`
      UPDATE "tb_debts" d
      SET "category" = c."name"
      FROM "tb_categories" c
      WHERE c."idtb_categories" = d."idtb_categories";
    `);

    const debtsTable = await queryRunner.getTable("tb_debts");
    const categoryFk = debtsTable?.foreignKeys.find((fk) =>
      fk.columnNames.includes("idtb_categories"),
    );
    if (categoryFk) {
      await queryRunner.dropForeignKey("tb_debts", categoryFk);
    }

    await queryRunner.dropColumn("tb_debts", "idtb_categories");
    await queryRunner.dropTable("tb_categories", true);
  }
}
