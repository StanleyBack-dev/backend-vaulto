import { Field, Float, InputType } from "@nestjs/graphql";
import { DebtType } from "@/modules/debts/domain/enums/debt-type.enum";

@InputType()
export class UpdateDebtDetailsInputDto {
  @Field()
  idDebt!: string;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  idCategory?: string;

  @Field(() => DebtType, { nullable: true })
  debtType?: DebtType;

  @Field(() => Date, { nullable: true })
  acquiredAt?: Date;

  @Field(() => Date, { nullable: true })
  dueDate?: Date;

  @Field(() => Float, { nullable: true })
  totalAmount?: number;
}
