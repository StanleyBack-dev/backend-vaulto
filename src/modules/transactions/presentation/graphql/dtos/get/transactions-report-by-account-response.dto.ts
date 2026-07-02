import { Field, Float, Int, ObjectType } from "@nestjs/graphql";
import type { TransactionsByAccountReportView } from "@/modules/transactions/application/ports/transaction-repository.port";

@ObjectType()
export class TransactionsReportByAccountResponseDto {
  static fromView(
    view: TransactionsByAccountReportView,
  ): TransactionsReportByAccountResponseDto {
    const dto = new TransactionsReportByAccountResponseDto();
    dto.idAccount = view.idAccount;
    dto.totalIncome = view.totalIncome;
    dto.totalExpense = view.totalExpense;
    dto.netAmount = view.netAmount;
    dto.count = view.count;
    return dto;
  }

  @Field()
  idAccount!: string;

  @Field(() => Float)
  totalIncome!: number;

  @Field(() => Float)
  totalExpense!: number;

  @Field(() => Float)
  netAmount!: number;

  @Field(() => Int)
  count!: number;
}
