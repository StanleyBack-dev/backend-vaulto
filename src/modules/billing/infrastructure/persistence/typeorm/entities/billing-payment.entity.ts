import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { BillingPaymentStatus } from "@/modules/billing/domain/enums/billing-payment-status.enum";

@Entity("tb_billing_payments")
export class BillingPaymentEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_billing_payments" })
  idBillingPayment!: string;

  @Column({ name: "idtb_users" })
  idUsers!: string;

  @Column({ name: "gateway_payment_id", unique: true })
  gatewayPaymentId!: string;

  @Column({ type: "numeric", precision: 12, scale: 2 })
  amount!: string;

  @Column({
    type: "enum",
    enum: BillingPaymentStatus,
    default: BillingPaymentStatus.PENDING,
  })
  status!: BillingPaymentStatus;

  @Column({ name: "due_date", type: "date", nullable: true })
  dueDate?: Date;

  @Column({ name: "paid_at", type: "timestamptz", nullable: true })
  paidAt?: Date;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
