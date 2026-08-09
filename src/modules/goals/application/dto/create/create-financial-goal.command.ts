export class CreateFinancialGoalCommand {
  title!: string;
  description?: string;
  targetAmount!: number;
  targetDate?: Date;
}
