import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";

export type DebtInstallmentProps = {
  installmentNumber: number;
  amountDue: number;
  dueDate: Date;
  amountPaid?: number;
  paidAt?: Date;
  status?: DebtStatus;
};

export class DebtInstallment {
  private constructor(private readonly props: DebtInstallmentProps) {}

  static create(props: DebtInstallmentProps): DebtInstallment {
    if (!Number.isFinite(props.amountDue) || props.amountDue <= 0) {
      throw AppException.from(APP_ERRORS.debts.invalidAmount, undefined);
    }

    return new DebtInstallment({
      ...props,
      amountDue: Number(props.amountDue.toFixed(2)),
      amountPaid: Number((props.amountPaid ?? 0).toFixed(2)),
      status: props.status ?? DebtStatus.OPEN,
    });
  }

  toPrimitive(): DebtInstallmentProps {
    return this.props;
  }
}
