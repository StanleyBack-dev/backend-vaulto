export class RegisterGoalContributionCommand {
  idFinancialGoal!: string;
  amount!: number;
  contributedAt?: Date;
  note?: string;
}
