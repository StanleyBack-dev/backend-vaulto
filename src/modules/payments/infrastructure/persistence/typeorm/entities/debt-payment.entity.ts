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

  @Column({ name: "idtb_debts", type: "uuid" })
  idDebt!: string;

  @Column({ name: "idtb_debt_installments", type: "uuid", nullable: true })
  idDebtInstallment?: string;

  @Column({ name: "idtb_users", type: "uuid" })
  idUsers!: string;

  @Column({ name: "amount_paid", type: "numeric", precision: 12, scale: 2 })
  amountPaid!: string;

  @Column({ name: "paid_at", type: "timestamptz" })
  paidAt!: Date;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
