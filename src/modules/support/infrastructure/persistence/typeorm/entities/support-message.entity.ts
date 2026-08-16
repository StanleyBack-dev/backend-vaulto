import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  PrimaryGeneratedColumn,
} from "typeorm";
import { SupportCategory } from "@/modules/support/domain/enums/support-category.enum";
import { SupportTicketStatus } from "@/modules/support/domain/enums/support-ticket-status.enum";

@Entity("tb_support_messages")
export class SupportMessageEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_support_messages" })
  idSupportMessage!: string;

  @Column({ name: "idtb_users" })
  idUsers!: string;

  @Column({ type: "varchar" })
  category!: SupportCategory;

  @Column({ type: "varchar", length: 2000 })
  message!: string;

  @Column({ name: "protocol_number", type: "int" })
  @Generated("increment")
  protocolNumber!: number;

  @Column({ type: "varchar", default: SupportTicketStatus.OPEN })
  status!: SupportTicketStatus;

  @Column({
    name: "admin_reply",
    type: "varchar",
    length: 2000,
    nullable: true,
  })
  adminReply?: string;

  @Column({ name: "replied_at", type: "timestamptz", nullable: true })
  repliedAt?: Date;

  @Column({ name: "replied_by_admin_id", type: "uuid", nullable: true })
  repliedByAdminId?: string;

  @Column({ name: "finalized_at", type: "timestamptz", nullable: true })
  finalizedAt?: Date;

  @Column({ name: "finalized_by_admin_id", type: "uuid", nullable: true })
  finalizedByAdminId?: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
