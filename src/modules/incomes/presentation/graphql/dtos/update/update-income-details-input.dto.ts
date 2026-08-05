import { Field, Float, InputType } from "@nestjs/graphql";
import { IncomeType } from "@/modules/incomes/domain/enums/income-type.enum";

@InputType()
export class UpdateIncomeDetailsInputDto {
  @Field()
  idIncome!: string;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  idCategory?: string;

  @Field(() => IncomeType, { nullable: true })
  incomeType?: IncomeType;

  @Field(() => Float, { nullable: true })
  expectedAmount?: number;

  @Field(() => Date, { nullable: true })
  expectedDate?: Date;

  @Field(() => Float, { nullable: true })
  receivedAmount?: number;

  @Field(() => Date, { nullable: true })
  receivedAt?: Date;

  @Field({ nullable: true })
  isRecurring?: boolean;
}
