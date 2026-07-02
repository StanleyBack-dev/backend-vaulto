import { Field, InputType, Int } from "@nestjs/graphql";
import { TransactionType } from "@/modules/transactions/domain/enums/transaction-type.enum";

@InputType()
export class ListTransactionsInputDto {
  @Field(() => Int, { nullable: true })
  page?: number;

  @Field(() => Int, { nullable: true })
  limit?: number;

  @Field({ nullable: true })
  idAccount?: string;

  @Field(() => TransactionType, { nullable: true })
  type?: TransactionType;
}
