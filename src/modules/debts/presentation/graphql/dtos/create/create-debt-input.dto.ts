import { Field, Float, InputType, Int } from "@nestjs/graphql";
import { DebtType } from "@/modules/debts/domain/enums/debt-type.enum";

@InputType()
export class CreateDebtInputDto {
  @Field()
  title!: string;

  @Field()
  idCategory!: string;

  @Field({ nullable: true })
  idCreditCard?: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => DebtType)
  debtType!: DebtType;

  @Field(() => Float, { nullable: true })
  totalAmount?: number;

  @Field(() => Date, { nullable: true })
  dueDate?: Date;

  @Field(() => Date, { nullable: true })
  acquiredAt?: Date;

  @Field()
  hasInstallments!: boolean;

  @Field(() => Int, { nullable: true })
  installmentCount?: number;

  @Field(() => Float, { nullable: true })
  installmentAmount?: number;
}
