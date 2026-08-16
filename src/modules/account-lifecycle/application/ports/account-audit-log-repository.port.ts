import type { AccountAuditEvent } from "@/modules/account-lifecycle/domain/enums/account-audit-event.enum";

export type RecordAccountAuditEventPayload = {
  idUsers: string;
  email: string;
  name: string;
  event: AccountAuditEvent;
};

export interface AccountAuditLogRepositoryPort {
  record(payload: RecordAccountAuditEventPayload): Promise<void>;
}

export const ACCOUNT_AUDIT_LOG_REPOSITORY = Symbol(
  "ACCOUNT_AUDIT_LOG_REPOSITORY",
);
