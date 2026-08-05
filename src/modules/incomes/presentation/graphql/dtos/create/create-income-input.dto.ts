import { Field, Float, InputType } from "@nestjs/graphql";
import { IncomeType } from "@/modules/incomes/domain/enums/income-type.enum";

@InputType()
export class CreateIncomeInputDto {
  @Field()
  title!: string;

  @Field()
  idCategory!: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => IncomeType)
  incomeType!: IncomeType;

  @Field(() => Float)
  expectedAmount!: number;

  @Field(() => Date)
  expectedDate!: Date;

  @Field({ nullable: true })
  isRecurring?: boolean;
}
