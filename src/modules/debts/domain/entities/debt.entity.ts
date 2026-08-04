import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";
import type { DebtType } from "@/modules/debts/domain/enums/debt-type.enum";
import { Money } from "@/modules/debts/domain/value-objects/money.vo";

export type DebtProps = {
  idUsers: string;
  idCategory: string;
  title: string;
  description?: string;
  debtType: DebtType;
  totalAmount?: number;
  installmentAmount?: number;
  dueDate?: Date;
  acquiredAt?: Date;
  startDate: Date;
  hasInstallments: boolean;
  installmentCount?: number;
  status?: DebtStatus;
};

export class Debt {
  private constructor(private readonly props: DebtProps) {}

  static create(props: DebtProps): Debt {
    const title = props.title?.trim();
    const idCategory = props.idCategory?.trim();

    if (!title || !idCategory) {
      throw AppException.from(APP_ERRORS.validation.missingField, {
        field: !title ? "title" : "idCategory",
      });
    }

    if (props.hasInstallments && !props.dueDate) {
      throw AppException.from(
        APP_ERRORS.debts.dueDateRequiredForInstallments,
        undefined,
      );
    }

    const installmentCount = props.hasInstallments ? props.installmentCount : 1;

    if (props.hasInstallments && (!installmentCount || installmentCount < 2)) {
      throw AppException.from(
        APP_ERRORS.debts.invalidInstallmentCount,
        undefined,
      );
    }

    if (!props.hasInstallments && installmentCount && installmentCount > 1) {
      throw AppException.from(
        APP_ERRORS.debts.invalidInstallmentCount,
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
    const amount = Money.from(baseTotalAmount ?? 0);

    return new Debt({
      ...props,
      idCategory,
      title,
      totalAmount: amount.toNumber(),
      installmentCount,
      installmentAmount: normalizedInstallmentAmount,
      status: props.status ?? DebtStatus.OPEN,
    });
  }

  toPrimitive(): DebtProps {
    return this.props;
  }
}
