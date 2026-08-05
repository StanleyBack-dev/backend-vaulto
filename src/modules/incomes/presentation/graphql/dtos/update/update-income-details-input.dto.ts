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

  @Field(() => Date, { nullable: true })
  dueDate?: Date;

  @Field(() => Float, { nullable: true })
  totalAmount?: number;

  @Field({ nullable: true })
  isRecurring?: boolean;
}
