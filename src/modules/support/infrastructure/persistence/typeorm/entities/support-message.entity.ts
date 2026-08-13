import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";
import { SupportCategory } from "@/modules/support/domain/enums/support-category.enum";

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

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
