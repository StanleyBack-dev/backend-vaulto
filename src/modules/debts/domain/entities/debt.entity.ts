import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";
import type { DebtType } from "@/modules/debts/domain/enums/debt-type.enum";
import { Money } from "@/modules/debts/domain/value-objects/money.vo";

export type DebtProps = {
  idUsers: string;
  idAccount: string;
  title: string;
  description?: string;
  debtType: DebtType;
  totalAmount: number;
  startDate: Date;
  hasInstallments: boolean;
  installmentCount?: number;
  status?: DebtStatus;
};

export class Debt {
  private constructor(private readonly props: DebtProps) {}

  static create(props: DebtProps): Debt {
    if (!props.idAccount?.trim()) {
      throw AppException.from(APP_ERRORS.debts.accountRequired, undefined);
    }

    const amount = Money.from(props.totalAmount);

    if (props.hasInstallments) {
      if (!props.installmentCount || props.installmentCount < 2) {
        throw AppException.from(APP_ERRORS.debts.invalidInstallmentCount, undefined);
      }
    }

    if (!props.hasInstallments && props.installmentCount && props.installmentCount > 1) {
      throw AppException.from(APP_ERRORS.debts.invalidInstallmentCount, undefined);
    }

    return new Debt({
      ...props,
      totalAmount: amount.toNumber(),
      installmentCount: props.hasInstallments ? props.installmentCount : 1,
      status: props.status ?? DebtStatus.OPEN,
    });
  }

  toPrimitive(): DebtProps {
    return this.props;
  }
}
