import { Field, InputType } from "@nestjs/graphql";
import { TransactionType } from "@/modules/transactions/domain/enums/transaction-type.enum";

@InputType()
export class GetTransactionsReportInputDto {
  @Field(() => Date, { nullable: true })
  startDate?: Date;

  @Field(() => Date, { nullable: true })
  endDate?: Date;

  @Field({ nullable: true })
  idAccount?: string;

  @Field(() => TransactionType, { nullable: true })
  type?: TransactionType;
}
