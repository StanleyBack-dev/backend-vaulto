import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
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

  @Column({ name: "trial_ends_at", type: "timestamptz", nullable: true })
  trialEndsAt?: Date;

  @Column({ name: "current_period_end", type: "timestamptz", nullable: true })
  currentPeriodEnd?: Date;

  @Column({ name: "cancel_at_period_end", default: false })
  cancelAtPeriodEnd!: boolean;

  @Column({ name: "gateway_customer_id", type: "varchar", nullable: true })
  gatewayCustomerId?: string;

  @Column({ name: "gateway_subscription_id", type: "varchar", nullable: true })
  gatewaySubscriptionId?: string;

  @Column({
    name: "trial_ending_notified_at",
    type: "timestamptz",
    nullable: true,
  })
  trialEndingNotifiedAt?: Date;

  @Column({ name: "past_due_since", type: "timestamptz", nullable: true })
  pastDueSince?: Date;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
