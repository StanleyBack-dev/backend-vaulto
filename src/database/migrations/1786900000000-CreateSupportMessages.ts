import type { MigrationInterface, QueryRunner } from "typeorm";
import { Table, TableIndex } from "typeorm";

export class CreateSupportMessages1786900000000 implements MigrationInterface {
  name = "CreateSupportMessages1786900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "tb_support_messages",
        columns: [
          {
            name: "idtb_support_messages",
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
            name: "category",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "message",
            type: "varchar",
            length: "2000",
            isNullable: false,
          },
          {
            name: "created_at",
            type: "timestamptz",
            default: "now()",
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      "tb_support_messages",
      new TableIndex({
        name: "idx_support_messages_user_created_at",
        columnNames: ["idtb_users", "created_at"],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("tb_support_messages");
  }
}
