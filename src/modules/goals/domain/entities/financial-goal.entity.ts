import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";

export type FinancialGoalProps = {
  idUsers: string;
  title: string;
  description?: string;
  targetAmount: number;
  targetDate?: Date;
};

export class FinancialGoal {
  private constructor(private readonly props: FinancialGoalProps) {}

  static create(props: FinancialGoalProps): FinancialGoal {
    const title = props.title?.trim();

    if (!title) {
      throw AppException.from(APP_ERRORS.validation.missingField, {
        field: "title",
      });
    }

    if (!Number.isFinite(props.targetAmount) || props.targetAmount <= 0) {
      throw AppException.from(APP_ERRORS.goals.invalidTargetAmount, undefined);
    }

    if (props.targetDate) {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      if (props.targetDate < today) {
        throw AppException.from(APP_ERRORS.goals.targetDateInPast, undefined);
      }
    }

    return new FinancialGoal({
      ...props,
      title,
      targetAmount: Number(props.targetAmount.toFixed(2)),
    });
  }

  toPrimitive(): FinancialGoalProps {
    return this.props;
  }
}
