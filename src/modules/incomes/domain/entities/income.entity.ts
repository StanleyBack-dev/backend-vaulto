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
  totalAmount?: number;
  installmentAmount?: number;
  dueDate?: Date;
  startDate: Date;
  hasInstallments: boolean;
  installmentCount?: number;
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

    if (props.hasInstallments && !props.dueDate) {
      throw AppException.from(
        APP_ERRORS.incomes.dueDateRequiredForInstallments,
        undefined,
      );
    }

    const installmentCount = props.hasInstallments ? props.installmentCount : 1;

    if (props.hasInstallments && (!installmentCount || installmentCount < 2)) {
      throw AppException.from(
        APP_ERRORS.incomes.invalidInstallmentCount,
        undefined,
      );
    }

    if (!props.hasInstallments && installmentCount && installmentCount > 1) {
      throw AppException.from(
        APP_ERRORS.incomes.invalidInstallmentCount,
        undefined,
      );
    }

    const normalizedInstallmentAmount = props.hasInstallments
      ? props.installmentAmount
      : undefined;
    const baseTotalAmount =
      props.hasInstallments &&
      normalizedInstallmentAmount &&
      normalizedInstallmentAmount > 0 &&
      installmentCount
        ? normalizedInstallmentAmount * installmentCount
        : props.totalAmount;

    if (!Number.isFinite(baseTotalAmount) || (baseTotalAmount ?? 0) <= 0) {
      throw AppException.from(APP_ERRORS.incomes.invalidAmount, undefined);
    }

    return new Income({
      ...props,
      idCategory,
      title,
      totalAmount: Number((baseTotalAmount as number).toFixed(2)),
      installmentCount,
      installmentAmount: normalizedInstallmentAmount,
      isRecurring: props.isRecurring ?? false,
      status: props.status ?? IncomeStatus.PENDING,
    });
  }

  toPrimitive(): IncomeProps {
    return this.props;
  }
}
