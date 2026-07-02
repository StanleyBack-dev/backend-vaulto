import { Field, Float, Int, ObjectType } from "@nestjs/graphql";
import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";
import type { DebtInstallmentView } from "@/modules/debts/application/ports/debt-repository.port";

@ObjectType()
export class DebtInstallmentResponseDto {
  static fromView(view: DebtInstallmentView): DebtInstallmentResponseDto {
    const dto = new DebtInstallmentResponseDto();
    dto.idDebtInstallment = view.idDebtInstallment;
    dto.idDebt = view.idDebt;
    dto.installmentNumber = view.installmentNumber;
    dto.amountDue = view.amountDue;
    dto.amountPaid = view.amountPaid;
    dto.dueDate = view.dueDate;
    dto.paidAt = view.paidAt;
    dto.status = view.status;
    return dto;
  }

  @Field()
  idDebtInstallment!: string;

  @Field()
  idDebt!: string;

  @Field(() => Int)
  installmentNumber!: number;

  @Field(() => Float)
  amountDue!: number;

  @Field(() => Float)
  amountPaid!: number;

  @Field(() => Date)
  dueDate!: Date;

  @Field(() => Date, { nullable: true })
  paidAt?: Date;

  @Field(() => DebtStatus)
  status!: DebtStatus;
}
