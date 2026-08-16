import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";
import { AccountDeactivationReason } from "@/modules/account-lifecycle/domain/enums/account-deactivation-reason.enum";

// Survey answers behind the "Inativar conta" flow. Not a snapshot table —
// deleted along with the rest of the user's personal data on account
// deletion (see AccountAuditLogEntity for the record that survives that).
@Entity("tb_account_deactivations")
export class AccountDeactivationEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_account_deactivations" })
  idAccountDeactivation!: string;

  @Column({ name: "idtb_users" })
  idUsers!: string;

  @Column({ type: "varchar", array: true })
  reasons!: AccountDeactivationReason[];

  @Column({
    name: "other_reason",
    type: "varchar",
    length: 500,
    nullable: true,
  })
  otherReason?: string;

  @Column({ name: "deactivated_at", type: "timestamptz" })
  deactivatedAt!: Date;

  @Column({ name: "reactivated_at", type: "timestamptz", nullable: true })
  reactivatedAt?: Date;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
