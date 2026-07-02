import { Field, Float, ObjectType } from "@nestjs/graphql";
import type { DebtPaymentView } from "@/modules/debts/application/ports/debt-repository.port";

@ObjectType()
export class DebtPaymentResponseDto {
  static fromView(view: DebtPaymentView): DebtPaymentResponseDto {
    const dto = new DebtPaymentResponseDto();
    dto.idDebtPayment = view.idDebtPayment;
    dto.idDebt = view.idDebt;
    dto.idUsers = view.idUsers;
    dto.amountPaid = view.amountPaid;
    dto.paidAt = view.paidAt;
    dto.createdAt = view.createdAt;
    return dto;
  }

  @Field()
  idDebtPayment!: string;

  @Field()
  idDebt!: string;

  @Field()
  idUsers!: string;

  @Field(() => Float)
  amountPaid!: number;

  @Field(() => Date)
  paidAt!: Date;

  @Field(() => Date)
  createdAt!: Date;
}
