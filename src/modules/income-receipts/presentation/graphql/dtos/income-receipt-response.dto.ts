import { Field, Float, ObjectType } from "@nestjs/graphql";
import { toLocalNaiveIsoString } from "@/common/utils/date.util";
import type { IncomeReceiptView } from "@/modules/income-receipts/application/ports/income-receipt-repository.port";

@ObjectType()
export class IncomeReceiptResponseDto {
  static fromView(view: IncomeReceiptView): IncomeReceiptResponseDto {
    const dto = new IncomeReceiptResponseDto();
    dto.idIncomeReceipt = view.idIncomeReceipt;
    dto.idIncome = view.idIncome;
    dto.idIncomeInstallment = view.idIncomeInstallment;
    dto.idUsers = view.idUsers;
    dto.amountReceived = view.amountReceived;
    dto.receivedAt = toLocalNaiveIsoString(view.receivedAt)!;
    dto.createdAt = toLocalNaiveIsoString(view.createdAt)!;
    return dto;
  }

  @Field()
  idIncomeReceipt!: string;

  @Field()
  idIncome!: string;

  @Field({ nullable: true })
  idIncomeInstallment?: string;

  @Field()
  idUsers!: string;

  @Field(() => Float)
  amountReceived!: number;

  @Field()
  receivedAt!: string;

  @Field()
  createdAt!: string;
}
