import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { MarketingEmailCategory } from "@/modules/marketing-emails/domain/enums/marketing-email-category.enum";

@Entity("tb_marketing_email_sends")
export class MarketingEmailSendEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_marketing_email_sends" })
  idMarketingEmailSend!: string;

  @Column({ type: "varchar" })
  category!: MarketingEmailCategory;

  @Column({ name: "recipient_email", type: "varchar" })
  recipientEmail!: string;

  @Column({ name: "recipient_name", type: "varchar" })
  recipientName!: string;

  @Column({ name: "recipient_phone", type: "varchar", nullable: true })
  recipientPhone?: string;

  @Column({ type: "varchar" })
  subject!: string;

  @Column({ name: "body_markdown", type: "text" })
  bodyMarkdown!: string;

  @Column({ name: "partnership_percentage", type: "real", nullable: true })
  partnershipPercentage?: number;

  @Column({ name: "sent_by_admin_id", type: "uuid" })
  sentByAdminId!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
