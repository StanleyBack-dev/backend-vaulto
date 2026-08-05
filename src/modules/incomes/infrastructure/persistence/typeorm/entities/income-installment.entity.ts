import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { dateOnlyTransformer } from "@/common/persistence/date-only.transformer";
import { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";

@Entity("tb_income_installments")
export class IncomeInstallmentEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_income_installments" })
  idIncomeInstallment!: string;

  @Column({ name: "idtb_incomes" })
  idIncome!: string;

  @Column({ name: "installment_number", type: "int" })
  installmentNumber!: number;

  @Column({ name: "amount_due", type: "numeric", precision: 12, scale: 2 })
  amountDue!: string;

  @Column({
    name: "amount_received",
    type: "numeric",
    precision: 12,
    scale: 2,
    default: 0,
  })
  amountReceived!: string;

  @Column({ name: "due_date", type: "date", transformer: dateOnlyTransformer })
  dueDate!: Date;

  @Column({ name: "received_at", type: "timestamptz", nullable: true })
  receivedAt?: Date;

  @Column({ type: "enum", enum: IncomeStatus, default: IncomeStatus.PENDING })
  status!: IncomeStatus;

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
  updatedAt!: Date;
}
