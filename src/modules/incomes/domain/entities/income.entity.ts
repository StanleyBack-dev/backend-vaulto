import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";
import type { IncomeType } from "@/modules/incomes/domain/enums/income-type.enum";

export type IncomeProps = {
  idUsers: string;
  idCategory: string;
  title: string;
  description?: string;
  incomeType: IncomeType;
  expectedAmount: number;
  expectedDate: Date;
  receivedAmount?: number;
  receivedAt?: Date;
  isRecurring?: boolean;
  status?: IncomeStatus;
};

export class Income {
  private constructor(private readonly props: IncomeProps) {}

  static create(props: IncomeProps): Income {
    const title = props.title?.trim();
    const idCategory = props.idCategory?.trim();

    if (!title || !idCategory) {
      throw AppException.from(APP_ERRORS.validation.missingField, {
        field: !title ? "title" : "idCategory",
      });
    }

    if (!Number.isFinite(props.expectedAmount) || props.expectedAmount <= 0) {
      throw AppException.from(APP_ERRORS.incomes.invalidAmount, undefined);
    }

    return new Income({
      ...props,
      idCategory,
      title,
      receivedAmount: props.receivedAmount ?? 0,
      isRecurring: props.isRecurring ?? false,
      status: props.status ?? IncomeStatus.PENDING,
    });
  }

  toPrimitive(): IncomeProps {
    return this.props;
  }
}
