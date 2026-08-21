import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("tb_referral_invites")
@Index(["idUsers", "targetEmail"], { unique: true })
export class ReferralInviteEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_referral_invites" })
  idReferralInvite!: string;

  @Column({ name: "idtb_users", type: "uuid" })
  idUsers!: string;

  @Column({ name: "target_email" })
  targetEmail!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
