import { Field, Float, Int, ObjectType } from "@nestjs/graphql";
import type { CreditCardView } from "@/modules/credit-cards/application/ports/credit-card-repository.port";

@ObjectType()
export class CreditCardResponseDto {
  static fromView(view: CreditCardView): CreditCardResponseDto {
    const dto = new CreditCardResponseDto();
    dto.idCreditCard = view.idCreditCard;
    dto.idUsers = view.idUsers;
    dto.name = view.name;
    dto.creditLimit = view.creditLimit;
    dto.dueDay = view.dueDay;
    dto.closingDay = view.closingDay;
    dto.status = view.status;
    dto.usedLimit = view.usedLimit;
    dto.availableLimit = view.availableLimit;
    dto.inactivatedAt = view.inactivatedAt;
    dto.createdAt = view.createdAt;
    dto.updatedAt = view.updatedAt;
    return dto;
  }

  @Field()
  idCreditCard!: string;

  @Field()
  idUsers!: string;

  @Field()
  name!: string;

  @Field(() => Float)
  creditLimit!: number;

  @Field(() => Int)
  dueDay!: number;

  @Field(() => Int)
  closingDay!: number;

  @Field()
  status!: boolean;

  @Field(() => Float)
  usedLimit!: number;

  @Field(() => Float)
  availableLimit!: number;

  @Field(() => Date, { nullable: true })
  inactivatedAt?: Date;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
