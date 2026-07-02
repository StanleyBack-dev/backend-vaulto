import { Field, InputType } from "@nestjs/graphql";
import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";

@InputType()
export class UpdateDebtStatusInputDto {
  @Field()
  idDebt!: string;

  @Field(() => DebtStatus)
  status!: DebtStatus;
}
