import { Field, Float, InputType, Int } from "@nestjs/graphql";
import { DebtType } from "@/modules/debts/domain/enums/debt-type.enum";

@InputType()
export class CreateDebtInputDto {
  @Field()
  idAccount!: string;

  @Field()
  title!: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => DebtType)
  debtType!: DebtType;

  @Field(() => Float)
  totalAmount!: number;

  @Field(() => Date)
  startDate!: Date;

  @Field()
  hasInstallments!: boolean;

  @Field(() => Int, { nullable: true })
  installmentCount?: number;
}
