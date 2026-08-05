import { Field, Float, ObjectType } from "@nestjs/graphql";
import type { IncomeView } from "@/modules/incomes/application/ports/income-repository.port";
import { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";
import { IncomeType } from "@/modules/incomes/domain/enums/income-type.enum";

@ObjectType()
export class IncomeResponseDto {
  static fromView(view: IncomeView): IncomeResponseDto {
    const dto = new IncomeResponseDto();
    dto.idIncome = view.idIncome;
    dto.idUsers = view.idUsers;
    dto.idCategory = view.idCategory;
    dto.category = view.category;
    dto.title = view.title;
    dto.description = view.description;
    dto.incomeType = view.incomeType;
    dto.expectedAmount = view.expectedAmount;
    dto.expectedDate = view.expectedDate;
    dto.receivedAmount = view.receivedAmount;
    dto.receivedAt = view.receivedAt;
    dto.isRecurring = view.isRecurring;
    dto.status = view.status;
    dto.createdAt = view.createdAt;
    dto.updatedAt = view.updatedAt;
    return dto;
  }

  @Field()
  idIncome!: string;

  @Field()
  idUsers!: string;

  @Field()
  idCategory!: string;

  @Field()
  category!: string;

  @Field()
  title!: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => IncomeType)
  incomeType!: IncomeType;

  @Field(() => Float)
  expectedAmount!: number;

  @Field(() => Date)
  expectedDate!: Date;

  @Field(() => Float)
  receivedAmount!: number;

  @Field(() => Date, { nullable: true })
  receivedAt?: Date;

  @Field()
  isRecurring!: boolean;

  @Field(() => IncomeStatus)
  status!: IncomeStatus;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
