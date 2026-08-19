import type { MigrationInterface, QueryRunner } from "typeorm";

// The columns below predate the newer tables' convention of storing
// timestamptz (UTC internally) and only converting to Brasília time at the
// display layer. As naive `timestamp` columns, their correct read-back
// depends entirely on every connection setting `-c timezone=America/Sao_Paulo`
// (see database.module.ts/datasource.ts) — a dependency that has already
// bitten us once when a stray local process connected without it. Converting
// to timestamptz makes the stored value unambiguous (a real UTC instant)
// regardless of the reading session's timezone.
//
// `AT TIME ZONE 'America/Sao_Paulo'` reinterprets the existing naive literal
// as Brasília wall-clock time and stores the equivalent UTC instant — this
// is the exact reverse of what toLocalNaiveIsoString does at read time, so
// it does not change the real-world moment any of these values represent.
const COLUMNS: Array<{ table: string; column: string }> = [
  { table: "tb_users", column: "created_at" },
  { table: "tb_users", column: "updated_at" },
  { table: "tb_users", column: "inactivated_at" },
  { table: "tb_categories", column: "created_at" },
  { table: "tb_categories", column: "updated_at" },
  { table: "tb_categories", column: "inactivated_at" },
  { table: "tb_credit_cards", column: "created_at" },
  { table: "tb_credit_cards", column: "updated_at" },
  { table: "tb_credit_cards", column: "inactivated_at" },
  { table: "tb_debt_installments", column: "created_at" },
  { table: "tb_debt_installments", column: "updated_at" },
  { table: "tb_income_installments", column: "created_at" },
  { table: "tb_income_installments", column: "updated_at" },
  { table: "tb_sessions", column: "created_at" },
  { table: "tb_sessions", column: "updated_at" },
  { table: "tb_sessions", column: "refresh_token_expires_at" },
  { table: "tb_sessions", column: "revoked_at" },
  { table: "tb_sessions", column: "last_used_at" },
  { table: "tb_user_page_access", column: "created_at" },
  { table: "tb_user_page_access", column: "updated_at" },
  { table: "tb_auth_verification_codes", column: "created_at" },
  { table: "tb_auth_verification_codes", column: "updated_at" },
  { table: "tb_auth_verification_codes", column: "expires_at" },
  { table: "tb_auth_verification_codes", column: "verified_at" },
  { table: "tb_auth_verification_codes", column: "reset_token_expires_at" },
  { table: "tb_auth_verification_codes", column: "consumed_at" },
  { table: "tb_auth_verification_codes", column: "invalidated_at" },
];

export class StandardizeTimestampColumnsToTimestamptz1787800000000 implements MigrationInterface {
  name = "StandardizeTimestampColumnsToTimestamptz1787800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const { table, column } of COLUMNS) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "${column}" TYPE timestamptz USING "${column}" AT TIME ZONE 'America/Sao_Paulo'`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const { table, column } of COLUMNS) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "${column}" TYPE timestamp USING "${column}" AT TIME ZONE 'America/Sao_Paulo'`,
      );
    }
  }
}
