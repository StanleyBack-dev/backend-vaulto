import { Field, Float, InputType, Int } from "@nestjs/graphql";
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

  @Field(() => Float, { nullable: true })
  totalAmount?: number;

  @Field(() => Date, { nullable: true })
  dueDate?: Date;

  @Field()
  hasInstallments!: boolean;

  @Field(() => Int, { nullable: true })
  installmentCount?: number;

  @Field(() => Float, { nullable: true })
  installmentAmount?: number;

  @Field({ nullable: true })
  isRecurring?: boolean;
}
