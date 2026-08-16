import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";
import { AccountAuditEvent } from "@/modules/account-lifecycle/domain/enums/account-audit-event.enum";

// Minimal, permanent audit trail of account lifecycle events. Deliberately
// has NO foreign key to tb_users and snapshots email/name at write time:
// this is the one record that must survive account deletion, including the
// DELETION_EXECUTED event itself, written right before the user row (and
// every other personal record) is deleted.
@Entity("tb_account_audit_log")
export class AccountAuditLogEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_account_audit_log" })
  idAccountAuditLog!: string;

  @Column({ name: "idtb_users" })
  idUsers!: string;

  @Column()
  email!: string;

  @Column()
  name!: string;

  @Column({ type: "varchar" })
  event!: AccountAuditEvent;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
