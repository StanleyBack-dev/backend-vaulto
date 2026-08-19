import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { PixKeyType } from "@/modules/referrals/domain/enums/pix-key-type.enum";
import { ReferralWithdrawalStatus } from "@/modules/referrals/domain/enums/referral-withdrawal-status.enum";

@Entity("tb_referral_withdrawals")
export class ReferralWithdrawalEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_referral_withdrawals" })
  idReferralWithdrawal!: string;

  @Column({ name: "idtb_users", type: "uuid" })
  idUsers!: string;

  @Column({ name: "amount_cents", type: "int" })
  amountCents!: number;

  @Column({ name: "pix_key" })
  pixKey!: string;

  @Column({ name: "pix_key_type", type: "varchar" })
  pixKeyType!: PixKeyType;

  @Column({ type: "varchar" })
  status!: ReferralWithdrawalStatus;

  @Column({ name: "gateway_transfer_id", nullable: true })
  gatewayTransferId?: string;

  @Column({ name: "fail_reason", type: "text", nullable: true })
  failReason?: string | null;

  @Column({ name: "requested_at", type: "timestamptz" })
  requestedAt!: Date;

  @Column({ name: "processed_at", type: "timestamptz", nullable: true })
  processedAt?: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
