import { Field, InputType } from "@nestjs/graphql";
import { DebtType } from "@/modules/debts/domain/enums/debt-type.enum";

@InputType()
export class GetDebtsReportInputDto {
  @Field(() => Date, { nullable: true })
  dueDateFrom?: Date;

  @Field(() => Date, { nullable: true })
  dueDateTo?: Date;

  @Field(() => DebtType, { nullable: true })
  debtType?: DebtType;

  @Field(() => String, { nullable: true })
  idCategory?: string;
}
