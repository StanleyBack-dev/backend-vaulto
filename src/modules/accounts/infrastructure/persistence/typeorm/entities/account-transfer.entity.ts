import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("tb_account_transfers")
export class AccountTransferEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_account_transfers" })
  idAccountTransfer!: string;

  @Column({ name: "idtb_users" })
  idUsers!: string;

  @Column({ name: "idtb_source_accounts" })
  sourceAccountId!: string;

  @Column({ name: "idtb_destination_accounts" })
  destinationAccountId!: string;

  @Column({ name: "amount", type: "numeric", precision: 12, scale: 2 })
  amount!: string;

  @Column({ name: "description", type: "text", nullable: true })
  description?: string;

  @Column({ name: "transferred_at", type: "timestamp" })
  transferredAt!: Date;

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date;
}
