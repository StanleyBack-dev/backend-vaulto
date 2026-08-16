export type CreateFinancialGoalPayload = {
  idUsers: string;
  title: string;
  description?: string;
  targetAmount: number;
  targetDate?: Date;
};

export type UpdateFinancialGoalPayload = {
  idFinancialGoal: string;
  title?: string;
  description?: string;
  targetAmount?: number;
  targetDate?: Date | null;
};

export type RegisterGoalContributionPayload = {
  idFinancialGoal: string;
  amount: number;
  contributedAt?: Date;
  note?: string;
};

export type UpdateGoalContributionPayload = {
  idFinancialGoal: string;
  idGoalContribution: string;
  amount?: number;
  contributedAt?: Date;
  note?: string;
};

export type GoalContributionView = {
  idGoalContribution: string;
  idFinancialGoal: string;
  amount: number;
  contributedAt: Date;
  note?: string;
  createdAt: Date;
};

export type FinancialGoalView = {
  idFinancialGoal: string;
  idUsers: string;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: Date;
  contributions: GoalContributionView[];
  createdAt: Date;
  updatedAt: Date;
};

export type ListFinancialGoalsFilters = {
  page?: number;
  limit?: number;
};

export interface FinancialGoalRepositoryPort {
  create(payload: CreateFinancialGoalPayload): Promise<FinancialGoalView>;
  listByUser(
    idUsers: string,
    filters?: ListFinancialGoalsFilters,
  ): Promise<{ records: FinancialGoalView[]; total: number }>;
  findById(
    idUsers: string,
    idFinancialGoal: string,
  ): Promise<FinancialGoalView>;
  update(
    idUsers: string,
    payload: UpdateFinancialGoalPayload,
  ): Promise<FinancialGoalView>;
  delete(idUsers: string, idFinancialGoal: string): Promise<void>;
  registerContribution(
    idUsers: string,
    payload: RegisterGoalContributionPayload,
  ): Promise<FinancialGoalView>;
  updateContribution(
    idUsers: string,
    payload: UpdateGoalContributionPayload,
  ): Promise<FinancialGoalView>;
  deleteContribution(
    idUsers: string,
    idFinancialGoal: string,
    idGoalContribution: string,
  ): Promise<FinancialGoalView>;
}

export const FINANCIAL_GOAL_REPOSITORY = Symbol("FINANCIAL_GOAL_REPOSITORY");
