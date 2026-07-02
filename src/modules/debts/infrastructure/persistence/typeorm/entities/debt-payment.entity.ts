import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("tb_debt_payments")
export class DebtPaymentEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_debt_payments" })
  idDebtPayment!: string;

  @Column({ name: "idtb_debts" })
  idDebt!: string;

  @Column({ name: "idtb_users" })
  idUsers!: string;

  @Column({ name: "amount_paid", type: "numeric", precision: 12, scale: 2 })
  amountPaid!: string;

  @Column({ name: "paid_at", type: "timestamp" })
  paidAt!: Date;

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date;
}
