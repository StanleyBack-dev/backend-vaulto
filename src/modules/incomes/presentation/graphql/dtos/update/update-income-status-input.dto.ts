import { Field, InputType } from "@nestjs/graphql";
import { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";

@InputType()
export class UpdateIncomeStatusInputDto {
  @Field()
  idIncome!: string;

  @Field(() => IncomeStatus)
  status!: IncomeStatus;
}
