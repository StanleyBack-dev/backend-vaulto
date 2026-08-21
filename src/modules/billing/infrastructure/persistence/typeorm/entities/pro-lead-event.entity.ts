import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ProLeadEvent } from "@/modules/billing/domain/enums/pro-lead-event.enum";

// Append-only funnel log for the Vaulto PRO subscription flow. Snapshots
// email/name at write time (no FK to tb_users) so the log survives account
// deletion, same rationale as tb_account_audit_log.
@Entity("tb_pro_lead_events")
@Index(["idUsers"])
@Index(["event", "createdAt"])
export class ProLeadEventEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_pro_lead_events" })
  idProLeadEvent!: string;

  @Column({ name: "idtb_users", type: "uuid" })
  idUsers!: string;

  @Column()
  email!: string;

  @Column()
  name!: string;

  @Column({ type: "varchar" })
  event!: ProLeadEvent;

  @Column({ name: "billing_cycle", type: "varchar", nullable: true })
  billingCycle?: string | null;

  @Column({ name: "checkout_url", type: "text", nullable: true })
  checkoutUrl?: string | null;

  @Column({ name: "gateway_subscription_id", type: "varchar", nullable: true })
  gatewaySubscriptionId?: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
