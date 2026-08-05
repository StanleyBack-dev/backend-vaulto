import { Field, Float, Int, ObjectType } from "@nestjs/graphql";
import { toLocalNaiveIsoString } from "@/common/utils/date.util";
import { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";
import type { IncomeInstallmentView } from "@/modules/incomes/application/ports/income-repository.port";

@ObjectType()
export class IncomeInstallmentResponseDto {
  static fromView(
    view: IncomeInstallmentView,
  ): IncomeInstallmentResponseDto {
    const dto = new IncomeInstallmentResponseDto();
    dto.idIncomeInstallment = view.idIncomeInstallment;
    dto.idIncome = view.idIncome;
    dto.installmentNumber = view.installmentNumber;
    dto.amountDue = view.amountDue;
    dto.amountReceived = view.amountReceived;
    dto.dueDate = view.dueDate;
    dto.receivedAt = toLocalNaiveIsoString(view.receivedAt);
    dto.status = view.status;
    return dto;
  }

  @Field()
  idIncomeInstallment!: string;

  @Field()
  idIncome!: string;

  @Field(() => Int)
  installmentNumber!: number;

  @Field(() => Float)
  amountDue!: number;

  @Field(() => Float)
  amountReceived!: number;

  @Field(() => Date)
  dueDate!: Date;

  @Field({ nullable: true })
  receivedAt?: string;

  @Field(() => IncomeStatus)
  status!: IncomeStatus;
}
