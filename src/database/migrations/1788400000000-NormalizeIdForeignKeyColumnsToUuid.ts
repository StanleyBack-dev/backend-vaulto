import type { MigrationInterface, QueryRunner } from "typeorm";

// Every `idtb_*` primary key in this schema is `uuid`, but many foreign-key
// columns that point at those keys were created as `character varying` —
// they came from entities whose `@Column({ name: "idtb_..." })` had no
// explicit `type`, so `synchronize` defaulted them to varchar. Postgres has
// no implicit `character varying = uuid` operator, so any query that joins
// one of these FKs against its uuid PK (or against tb_users / the referral
// tables, which are uuid) fails with
// `operator does not exist: character varying = uuid`.
//
// Previous fixes wrapped individual queries in `CAST(... AS varchar)`, which
// only papers over each call site one at a time. This migration fixes the
// root cause: it converts every affected FK column to `uuid` so the types
// line up everywhere. The matching `type: "uuid"` is added to the entities
// in the same change, and the CAST workarounds are removed.
//
// Each conversion is guarded on the column's current type, because the DB
// state differs per environment: on dev the whole schema came from
// `synchronize` (all of these are varchar), while on beta/prod the
// migration-created tables (tb_subscriptions, tb_billing_payments, the
// account-lifecycle tables, ...) may already have `uuid` here.
const COLUMNS: Array<{ table: string; column: string }> = [
  { table: "tb_categories", column: "idtb_users" },
  { table: "tb_credit_cards", column: "idtb_users" },
  { table: "tb_debts", column: "idtb_users" },
  { table: "tb_debts", column: "idtb_categories" },
  { table: "tb_debts", column: "idtb_credit_cards" },
  { table: "tb_debt_installments", column: "idtb_debts" },
  { table: "tb_debt_payments", column: "idtb_debts" },
  { table: "tb_debt_payments", column: "idtb_debt_installments" },
  { table: "tb_debt_payments", column: "idtb_users" },
  { table: "tb_incomes", column: "idtb_users" },
  { table: "tb_incomes", column: "idtb_categories" },
  { table: "tb_income_installments", column: "idtb_incomes" },
  { table: "tb_income_receipts", column: "idtb_incomes" },
  { table: "tb_income_receipts", column: "idtb_income_installments" },
  { table: "tb_income_receipts", column: "idtb_users" },
  { table: "tb_financial_goals", column: "idtb_users" },
  { table: "tb_goal_contributions", column: "idtb_financial_goals" },
  { table: "tb_subscriptions", column: "idtb_users" },
  { table: "tb_subscription_cancellations", column: "idtb_users" },
  { table: "tb_billing_payments", column: "idtb_users" },
  { table: "tb_support_messages", column: "idtb_users" },
  { table: "tb_account_audit_log", column: "idtb_users" },
  { table: "tb_account_deactivations", column: "idtb_users" },
  { table: "tb_account_deletions", column: "idtb_users" },
];

async function currentType(
  queryRunner: QueryRunner,
  table: string,
  column: string,
): Promise<string | null> {
  const rows: Array<{ data_type: string }> = await queryRunner.query(
    `SELECT data_type FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
    [table, column],
  );
  return rows[0]?.data_type ?? null;
}

export class NormalizeIdForeignKeyColumnsToUuid1788400000000 implements MigrationInterface {
  name = "NormalizeIdForeignKeyColumnsToUuid1788400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const { table, column } of COLUMNS) {
      const type = await currentType(queryRunner, table, column);
      if (type === null || type === "uuid") {
        continue;
      }
      // NULLIF guards against any '' that slipped in instead of NULL on the
      // nullable columns; ''::uuid would otherwise abort the whole ALTER.
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "${column}" TYPE uuid USING NULLIF("${column}"::text, '')::uuid`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const { table, column } of COLUMNS) {
      const type = await currentType(queryRunner, table, column);
      if (type === null || type === "character varying") {
        continue;
      }
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "${column}" TYPE character varying USING "${column}"::text`,
      );
    }
  }
}
