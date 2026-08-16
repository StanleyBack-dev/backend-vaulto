export class UpdateGoalContributionCommand {
  idFinancialGoal!: string;
  idGoalContribution!: string;
  amount?: number;
  contributedAt?: Date;
  note?: string;
}
