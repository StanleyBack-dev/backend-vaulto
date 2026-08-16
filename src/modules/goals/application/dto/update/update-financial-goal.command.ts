export class UpdateFinancialGoalCommand {
  idFinancialGoal!: string;
  title?: string;
  description?: string;
  targetAmount?: number;
  targetDate?: Date | null;
}
