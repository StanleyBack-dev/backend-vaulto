import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { dateOnlyTransformer } from "@/common/persistence/date-only.transformer";
import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";

@Entity("tb_debt_installments")
export class DebtInstallmentEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_debt_installments" })
  idDebtInstallment!: string;

  @Column({ name: "idtb_debts" })
  idDebt!: string;

  @Column({ name: "installment_number", type: "int" })
  installmentNumber!: number;

  @Column({ name: "amount_due", type: "numeric", precision: 12, scale: 2 })
  amountDue!: string;

  @Column({
    name: "amount_paid",
    type: "numeric",
    precision: 12,
    scale: 2,
    default: 0,
  })
  amountPaid!: string;

  @Column({ name: "due_date", type: "date", transformer: dateOnlyTransformer })
  dueDate!: Date;

  @Column({ name: "paid_at", type: "timestamptz", nullable: true })
  paidAt?: Date;

  @Column({ type: "enum", enum: DebtStatus, default: DebtStatus.OPEN })
  status!: DebtStatus;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
