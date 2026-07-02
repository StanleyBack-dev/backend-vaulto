import { Field, Float, Int, ObjectType } from "@nestjs/graphql";
import type { TransactionsByTypeReportView } from "@/modules/transactions/application/ports/transaction-repository.port";
import { TransactionType } from "@/modules/transactions/domain/enums/transaction-type.enum";

@ObjectType()
export class TransactionsReportByTypeResponseDto {
  static fromView(view: TransactionsByTypeReportView): TransactionsReportByTypeResponseDto {
    const dto = new TransactionsReportByTypeResponseDto();
    dto.type = view.type;
    dto.totalAmount = view.totalAmount;
    dto.count = view.count;
    return dto;
  }

  @Field(() => TransactionType)
  type!: TransactionType;

  @Field(() => Float)
  totalAmount!: number;

  @Field(() => Int)
  count!: number;
}
