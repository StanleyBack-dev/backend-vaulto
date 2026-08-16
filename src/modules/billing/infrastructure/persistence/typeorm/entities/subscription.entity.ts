import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { SubscriptionBillingCycle } from "@/modules/billing/domain/enums/subscription-billing-cycle.enum";
import { SubscriptionPlan } from "@/modules/billing/domain/enums/subscription-plan.enum";
import { SubscriptionStatus } from "@/modules/billing/domain/enums/subscription-status.enum";

@Entity("tb_subscriptions")
export class SubscriptionEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_subscriptions" })
  idSubscription!: string;

  @Column({ name: "idtb_users", unique: true })
  @Index()
  idUsers!: string;

  @Column({
    type: "enum",
    enum: SubscriptionPlan,
    default: SubscriptionPlan.FREE,
  })
  plan!: SubscriptionPlan;

  @Column({
    type: "enum",
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status!: SubscriptionStatus;

  @Column({ name: "pro_started_at", type: "timestamptz", nullable: true })
  proStartedAt?: Date;

  @Column({ name: "current_period_end", type: "timestamptz", nullable: true })
  currentPeriodEnd?: Date;

  @Column({
    name: "billing_cycle",
    type: "enum",
    enum: SubscriptionBillingCycle,
    nullable: true,
  })
  billingCycle?: SubscriptionBillingCycle;

  @Column({ name: "cancel_at_period_end", default: false })
  cancelAtPeriodEnd!: boolean;

  @Column({ name: "gateway_customer_id", type: "varchar", nullable: true })
  gatewayCustomerId?: string;

  @Column({ name: "gateway_subscription_id", type: "varchar", nullable: true })
  gatewaySubscriptionId?: string;

  @Column({
    name: "gateway_pix_authorization_id",
    type: "varchar",
    nullable: true,
  })
  gatewayPixAuthorizationId?: string;

  @Column({ name: "past_due_since", type: "timestamptz", nullable: true })
  pastDueSince?: Date;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
