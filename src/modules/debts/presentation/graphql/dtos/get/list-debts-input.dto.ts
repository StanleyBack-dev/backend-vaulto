import { Field, InputType, Int } from "@nestjs/graphql";
import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";
import { DebtType } from "@/modules/debts/domain/enums/debt-type.enum";

@InputType()
export class ListDebtsInputDto {
  @Field(() => Int, { nullable: true })
  page?: number;

  @Field(() => Int, { nullable: true })
  limit?: number;

  @Field(() => DebtStatus, { nullable: true })
  status?: DebtStatus;

  @Field(() => DebtType, { nullable: true })
  debtType?: DebtType;
}
