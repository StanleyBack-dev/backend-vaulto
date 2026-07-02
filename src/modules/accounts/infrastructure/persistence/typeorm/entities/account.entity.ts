import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { AccountType } from "@/modules/accounts/domain/enums/account-type.enum";

@Entity("tb_accounts")
export class AccountEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_accounts" })
  idAccount!: string;

  @Column({ name: "idtb_users" })
  idUsers!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ name: "account_type", type: "enum", enum: AccountType })
  accountType!: AccountType;

  @Column({ name: "initial_balance", type: "numeric", precision: 12, scale: 2 })
  initialBalance!: string;

  @Column({ name: "current_balance", type: "numeric", precision: 12, scale: 2 })
  currentBalance!: string;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
  updatedAt!: Date;
}
