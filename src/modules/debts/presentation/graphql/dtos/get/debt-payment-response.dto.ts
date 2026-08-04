import { Field, Float, ObjectType } from "@nestjs/graphql";
import { toLocalNaiveIsoString } from "@/common/utils/date.util";
import type { DebtPaymentView } from "@/modules/debts/application/ports/debt-repository.port";

@ObjectType()
export class DebtPaymentResponseDto {
  static fromView(view: DebtPaymentView): DebtPaymentResponseDto {
    const dto = new DebtPaymentResponseDto();
    dto.idDebtPayment = view.idDebtPayment;
    dto.idDebt = view.idDebt;
    dto.idDebtInstallment = view.idDebtInstallment;
    dto.idUsers = view.idUsers;
    dto.amountPaid = view.amountPaid;
    dto.paidAt = toLocalNaiveIsoString(view.paidAt)!;
    dto.createdAt = toLocalNaiveIsoString(view.createdAt)!;
    return dto;
  }

  @Field()
  idDebtPayment!: string;

  @Field()
  idDebt!: string;

  @Field({ nullable: true })
  idDebtInstallment?: string;

  @Field()
  idUsers!: string;

  @Field(() => Float)
  amountPaid!: number;

  @Field()
  paidAt!: string;

  @Field()
  createdAt!: string;
}
