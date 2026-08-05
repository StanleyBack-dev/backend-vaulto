import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";

export type IncomeInstallmentProps = {
  installmentNumber: number;
  amountDue: number;
  dueDate: Date;
  amountReceived?: number;
  receivedAt?: Date;
  status?: IncomeStatus;
};

export class IncomeInstallment {
  private constructor(private readonly props: IncomeInstallmentProps) {}

  static create(props: IncomeInstallmentProps): IncomeInstallment {
    if (!Number.isFinite(props.amountDue) || props.amountDue <= 0) {
      throw AppException.from(APP_ERRORS.incomes.invalidAmount, undefined);
    }

    return new IncomeInstallment({
      ...props,
      amountDue: Number(props.amountDue.toFixed(2)),
      amountReceived: Number((props.amountReceived ?? 0).toFixed(2)),
      status: props.status ?? IncomeStatus.PENDING,
    });
  }

  toPrimitive(): IncomeInstallmentProps {
    return this.props;
  }
}
