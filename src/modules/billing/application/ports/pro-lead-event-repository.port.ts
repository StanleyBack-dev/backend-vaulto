import type { ProLeadEvent } from "@/modules/billing/domain/enums/pro-lead-event.enum";

export type RecordProLeadEventPayload = {
  idUsers: string;
  email: string;
  name: string;
  event: ProLeadEvent;
  billingCycle?: string;
  checkoutUrl?: string;
  gatewaySubscriptionId?: string;
};

export interface ProLeadEventRepositoryPort {
  record(payload: RecordProLeadEventPayload): Promise<void>;
}

export const PRO_LEAD_EVENT_REPOSITORY = Symbol("PRO_LEAD_EVENT_REPOSITORY");
