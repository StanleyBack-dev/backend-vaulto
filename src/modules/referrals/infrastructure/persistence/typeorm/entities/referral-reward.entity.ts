import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ReferralRewardStatus } from "@/modules/referrals/domain/enums/referral-reward-status.enum";

// Capped at one row per referrer, ever — enforced in QualifyReferralUseCase,
// not at the DB level (matches how other business invariants in this
// codebase are enforced in the use-case, not via constraints).
@Entity("tb_referral_rewards")
export class ReferralRewardEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_referral_rewards" })
  idReferralReward!: string;

  @Column({ name: "idtb_users" })
  idUsers!: string;

  @Column({ type: "varchar" })
  status!: ReferralRewardStatus;

  @Column({ name: "granted_at", type: "timestamptz" })
  grantedAt!: Date;

  @Column({ name: "applied_at", type: "timestamptz", nullable: true })
  appliedAt?: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
