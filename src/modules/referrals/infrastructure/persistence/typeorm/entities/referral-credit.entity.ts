import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { ReferralCreditStatus } from "@/modules/referrals/domain/enums/referral-credit-status.enum";

// One row per qualified referral — the referrer's ledger entry for that
// specific indication. idReferredUser is what lets a webhook clawback find
// the right credit to reverse when the referred user's payment is
// refunded/charged back.
@Entity("tb_referral_credits")
export class ReferralCreditEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_referral_credits" })
  idReferralCredit!: string;

  @Column({ name: "idtb_users", type: "uuid" })
  idUsers!: string;

  @Column({ name: "idtb_referred_user", type: "uuid" })
  idReferredUser!: string;

  @Column({ name: "amount_cents", type: "int" })
  amountCents!: number;

  @Column({ type: "varchar" })
  status!: ReferralCreditStatus;

  @Column({ name: "qualified_at", type: "timestamptz" })
  qualifiedAt!: Date;

  @Column({ name: "available_at", type: "timestamptz" })
  availableAt!: Date;

  @Column({ name: "clawed_back_at", type: "timestamptz", nullable: true })
  clawedBackAt?: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
