import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("tb_income_receipts")
export class IncomeReceiptEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_income_receipts" })
  idIncomeReceipt!: string;

  @Column({ name: "idtb_incomes" })
  idIncome!: string;

  @Column({ name: "idtb_income_installments", nullable: true })
  idIncomeInstallment?: string;

  @Column({ name: "idtb_users" })
  idUsers!: string;

  @Column({ name: "amount_received", type: "numeric", precision: 12, scale: 2 })
  amountReceived!: string;

  @Column({ name: "received_at", type: "timestamptz" })
  receivedAt!: Date;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
