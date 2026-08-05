import type { MigrationInterface } from "typeorm";

/**
 * Marks the point where this project switches from TypeORM `synchronize`
 * to migration-first schema management. Production's schema was already
 * created by `synchronize` from the current entities (tb_users,
 * tb_auth_credentials, tb_auth_verification_codes, tb_sessions,
 * tb_user_page_access, tb_categories, tb_credit_cards, tb_debts,
 * tb_debt_installments, tb_debt_payments) and confirmed to match them
 * exactly, so there is no schema diff to apply here — this migration only
 * needs to run once to seed the migrations tracking table. Every migration
 * added after this one is a real, reviewable schema change.
 */
export class AdoptMigrationsBaseline1785917230618 implements MigrationInterface {
  name = "AdoptMigrationsBaseline1785917230618";

  public async up(): Promise<void> {
    // Intentional no-op: see class doc comment above.
  }

  public async down(): Promise<void> {
    // Intentional no-op: see class doc comment above.
  }
}
