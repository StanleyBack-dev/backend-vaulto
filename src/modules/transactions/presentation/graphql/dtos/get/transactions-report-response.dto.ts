import { Field, Float, Int, ObjectType } from "@nestjs/graphql";
import type { TransactionsReportView } from "@/modules/transactions/application/ports/transaction-repository.port";
import { TransactionsReportByAccountResponseDto } from "@/modules/transactions/presentation/graphql/dtos/get/transactions-report-by-account-response.dto";
import { TransactionsReportByTypeResponseDto } from "@/modules/transactions/presentation/graphql/dtos/get/transactions-report-by-type-response.dto";

@ObjectType()
export class TransactionsReportResponseDto {
  static fromView(view: TransactionsReportView): TransactionsReportResponseDto {
    const dto = new TransactionsReportResponseDto();
    dto.startDate = view.startDate;
    dto.endDate = view.endDate;
    dto.totalIncome = view.totalIncome;
    dto.totalExpense = view.totalExpense;
    dto.netAmount = view.netAmount;
    dto.totalCount = view.totalCount;
    dto.byType = view.byType.map((item) =>
      TransactionsReportByTypeResponseDto.fromView(item),
    );
    dto.byAccount = view.byAccount.map((item) =>
      TransactionsReportByAccountResponseDto.fromView(item),
    );
    return dto;
  }

  @Field(() => Date, { nullable: true })
  startDate?: Date;

  @Field(() => Date, { nullable: true })
  endDate?: Date;

  @Field(() => Float)
  totalIncome!: number;

  @Field(() => Float)
  totalExpense!: number;

  @Field(() => Float)
  netAmount!: number;

  @Field(() => Int)
  totalCount!: number;

  @Field(() => [TransactionsReportByTypeResponseDto])
  byType!: TransactionsReportByTypeResponseDto[];

  @Field(() => [TransactionsReportByAccountResponseDto])
  byAccount!: TransactionsReportByAccountResponseDto[];
}
