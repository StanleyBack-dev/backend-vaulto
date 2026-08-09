import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";
import { dateOnlyTransformer } from "@/common/persistence/date-only.transformer";

@Entity("tb_goal_contributions")
export class GoalContributionEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_goal_contributions" })
  idGoalContribution!: string;

  @Column({ name: "idtb_financial_goals" })
  idFinancialGoal!: string;

  @Column({ type: "numeric", precision: 12, scale: 2 })
  amount!: string;

  @Column({
    name: "contributed_at",
    type: "date",
    transformer: dateOnlyTransformer,
  })
  contributedAt!: Date;

  @Column({ length: 255, nullable: true })
  note?: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
