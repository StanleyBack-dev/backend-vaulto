import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { dateOnlyTransformer } from "@/common/persistence/date-only.transformer";
import { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";
import { IncomeType } from "@/modules/incomes/domain/enums/income-type.enum";

@Entity("tb_incomes")
export class IncomeEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_incomes" })
  idIncome!: string;

  @Column({ name: "idtb_users" })
  idUsers!: string;

  @Column({ length: 120 })
  title!: string;

  @Column({ name: "idtb_categories" })
  idCategory!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({
    name: "income_type",
    type: "enum",
    enum: IncomeType,
  })
  incomeType!: IncomeType;

  @Column({ name: "total_amount", type: "numeric", precision: 12, scale: 2 })
  totalAmount!: string;

  @Column({
    name: "start_date",
    type: "date",
    transformer: dateOnlyTransformer,
  })
  startDate!: Date;

  @Column({
    name: "due_date",
    type: "date",
    nullable: true,
    transformer: dateOnlyTransformer,
  })
  dueDate?: Date;

  @Column({ name: "has_installments", type: "boolean", default: false })
  hasInstallments!: boolean;

  @Column({ name: "installment_count", type: "int", default: 1 })
  installmentCount!: number;

  @Column({ name: "is_recurring", type: "boolean", default: false })
  isRecurring!: boolean;

  @Column({ type: "enum", enum: IncomeStatus, default: IncomeStatus.PENDING })
  status!: IncomeStatus;

  @Column({ name: "received_at", type: "timestamptz", nullable: true })
  receivedAt?: Date;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
