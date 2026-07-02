import { Field, Float, InputType } from "@nestjs/graphql";
import { TransactionType } from "@/modules/transactions/domain/enums/transaction-type.enum";

@InputType()
export class CreateTransactionInputDto {
  @Field()
  idAccount!: string;

  @Field(() => TransactionType)
  type!: TransactionType;

  @Field(() => Float)
  amount!: number;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Date, { nullable: true })
  occurredAt?: Date;
}
