import { Field, InputType, Int } from "@nestjs/graphql";
import { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";
import { IncomeType } from "@/modules/incomes/domain/enums/income-type.enum";

@InputType()
export class ListIncomesInputDto {
  @Field(() => Int, { nullable: true })
  page?: number;

  @Field(() => Int, { nullable: true })
  limit?: number;

  @Field(() => IncomeStatus, { nullable: true })
  status?: IncomeStatus;

  @Field(() => IncomeType, { nullable: true })
  incomeType?: IncomeType;

  @Field(() => String, { nullable: true })
  idCategory?: string;

  @Field(() => Date, { nullable: true })
  dueDateFrom?: Date;

  @Field(() => Date, { nullable: true })
  dueDateTo?: Date;
}
