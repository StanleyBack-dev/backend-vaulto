import { Field, Float, ObjectType } from "@nestjs/graphql";
import type { TransactionView } from "@/modules/transactions/application/ports/transaction-repository.port";
import { TransactionType } from "@/modules/transactions/domain/enums/transaction-type.enum";

@ObjectType()
export class TransactionResponseDto {
  static fromView(view: TransactionView): TransactionResponseDto {
    const dto = new TransactionResponseDto();
    dto.idTransaction = view.idTransaction;
    dto.idUsers = view.idUsers;
    dto.idAccount = view.idAccount;
    dto.type = view.type;
    dto.amount = view.amount;
    dto.description = view.description;
    dto.occurredAt = view.occurredAt;
    dto.createdAt = view.createdAt;
    return dto;
  }

  @Field()
  idTransaction!: string;

  @Field()
  idUsers!: string;

  @Field()
  idAccount!: string;

  @Field(() => TransactionType)
  type!: TransactionType;

  @Field(() => Float)
  amount!: number;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Date)
  occurredAt!: Date;

  @Field(() => Date)
  createdAt!: Date;
}
