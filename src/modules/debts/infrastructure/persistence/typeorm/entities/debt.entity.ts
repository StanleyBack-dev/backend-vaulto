import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";
import { DebtType } from "@/modules/debts/domain/enums/debt-type.enum";

@Entity("tb_debts")
export class DebtEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_debts" })
  idDebt!: string;

  @Column({ name: "idtb_users" })
  idUsers!: string;

  @Column({ name: "idtb_accounts" })
  idAccount!: string;

  @Column({ length: 120 })
  title!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({
    name: "debt_type",
    type: "enum",
    enum: DebtType,
  })
  debtType!: DebtType;

  @Column({ name: "total_amount", type: "numeric", precision: 12, scale: 2 })
  totalAmount!: string;

  @Column({ name: "start_date", type: "date" })
  startDate!: Date;

  @Column({ name: "has_installments", type: "boolean", default: false })
  hasInstallments!: boolean;

  @Column({ name: "installment_count", type: "int", default: 1 })
  installmentCount!: number;

  @Column({ type: "enum", enum: DebtStatus, default: DebtStatus.OPEN })
  status!: DebtStatus;

  @Column({ name: "settled_at", type: "timestamp", nullable: true })
  settledAt?: Date;

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
  updatedAt!: Date;
}
