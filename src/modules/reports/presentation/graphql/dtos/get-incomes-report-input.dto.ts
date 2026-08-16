import { Field, InputType } from "@nestjs/graphql";
import { IncomeType } from "@/modules/incomes/domain/enums/income-type.enum";

@InputType()
export class GetIncomesReportInputDto {
  @Field(() => Date, { nullable: true })
  dueDateFrom?: Date;

  @Field(() => Date, { nullable: true })
  dueDateTo?: Date;

  @Field(() => IncomeType, { nullable: true })
  incomeType?: IncomeType;

  @Field(() => String, { nullable: true })
  idCategory?: string;
}
