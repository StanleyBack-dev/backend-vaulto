import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { dateOnlyTransformer } from "@/common/persistence/date-only.transformer";

@Entity("tb_financial_goals")
export class FinancialGoalEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_financial_goals" })
  idFinancialGoal!: string;

  @Column({ name: "idtb_users" })
  idUsers!: string;

  @Column({ length: 120 })
  title!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ name: "target_amount", type: "numeric", precision: 12, scale: 2 })
  targetAmount!: string;

  @Column({
    name: "target_date",
    type: "date",
    nullable: true,
    transformer: dateOnlyTransformer,
  })
  targetDate?: Date;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
