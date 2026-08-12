import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";
import { CancellationReason } from "@/modules/billing/domain/enums/cancellation-reason.enum";
import { SubscriptionBillingCycle } from "@/modules/billing/domain/enums/subscription-billing-cycle.enum";

@Entity("tb_subscription_cancellations")
export class SubscriptionCancellationEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_subscription_cancellations" })
  idSubscriptionCancellation!: string;

  @Column({ name: "idtb_users" })
  idUsers!: string;

  @Column({ type: "varchar", array: true })
  reasons!: CancellationReason[];

  @Column({
    name: "other_reason",
    type: "varchar",
    length: 500,
    nullable: true,
  })
  otherReason?: string;

  @Column({
    name: "billing_cycle",
    type: "varchar",
    nullable: true,
  })
  billingCycle?: SubscriptionBillingCycle;

  @Column({ name: "pro_started_at", type: "timestamptz", nullable: true })
  proStartedAt?: Date;

  @Column({ name: "requested_at", type: "timestamptz" })
  requestedAt!: Date;

  @Column({
    name: "effective_cancellation_at",
    type: "timestamptz",
    nullable: true,
  })
  effectiveCancellationAt?: Date;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
