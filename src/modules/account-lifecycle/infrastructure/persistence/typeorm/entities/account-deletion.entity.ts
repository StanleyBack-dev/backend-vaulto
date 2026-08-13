import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";
import { AccountDeletionReason } from "@/modules/account-lifecycle/domain/enums/account-deletion-reason.enum";

// Survey answers + grace-period tracking behind the "Excluir conta" flow.
// Deleted along with the rest of the user's personal data once the deletion
// is actually executed (see AccountAuditLogEntity for the record that
// survives that).
@Entity("tb_account_deletions")
export class AccountDeletionEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_account_deletions" })
  idAccountDeletion!: string;

  @Column({ name: "idtb_users" })
  idUsers!: string;

  @Column()
  email!: string;

  @Column({ type: "varchar", array: true })
  reasons!: AccountDeletionReason[];

  @Column({
    name: "other_reason",
    type: "varchar",
    length: 500,
    nullable: true,
  })
  otherReason?: string;

  @Column({ name: "requested_at", type: "timestamptz" })
  requestedAt!: Date;

  @Column({ name: "scheduled_for", type: "timestamptz" })
  scheduledFor!: Date;

  @Column({ name: "cancelled_at", type: "timestamptz", nullable: true })
  cancelledAt?: Date;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
