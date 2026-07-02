import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";
import { TransactionType } from "@/modules/transactions/domain/enums/transaction-type.enum";

@Entity("tb_transactions")
export class TransactionEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_transactions" })
  idTransaction!: string;

  @Column({ name: "idtb_users" })
  idUsers!: string;

  @Column({ name: "idtb_accounts" })
  idAccount!: string;

  @Column({ name: "transaction_type", type: "enum", enum: TransactionType })
  type!: TransactionType;

  @Column({ name: "amount", type: "numeric", precision: 12, scale: 2 })
  amount!: string;

  @Column({ name: "description", type: "text", nullable: true })
  description?: string;

  @Column({ name: "occurred_at", type: "timestamp" })
  occurredAt!: Date;

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date;
}
