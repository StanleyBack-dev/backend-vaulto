import { Field, Float, Int, ObjectType } from "@nestjs/graphql";
import type { IncomeView } from "@/modules/incomes/application/ports/income-repository.port";
import { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";
import { IncomeType } from "@/modules/incomes/domain/enums/income-type.enum";
import { IncomeInstallmentResponseDto } from "@/modules/incomes/presentation/graphql/dtos/get/income-installment-response.dto";

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
    dto.totalAmount = view.totalAmount;
    dto.dueDate = view.dueDate;
    dto.endDate = view.endDate;
    dto.startDate = view.startDate;
    dto.hasInstallments = view.hasInstallments;
    dto.installmentCount = view.installmentCount;
    dto.isRecurring = view.isRecurring;
    dto.status = view.status;
    dto.receivedAt = view.receivedAt;
    dto.installments = view.installments.map((installment) =>
      IncomeInstallmentResponseDto.fromView(installment),
    );
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
  totalAmount!: number;

  @Field(() => Date, { nullable: true })
  dueDate?: Date;

  @Field(() => Date, { nullable: true })
  endDate?: Date;

  @Field(() => Date)
  startDate!: Date;

  @Field()
  hasInstallments!: boolean;

  @Field(() => Int)
  installmentCount!: number;

  @Field()
  isRecurring!: boolean;

  @Field(() => IncomeStatus)
  status!: IncomeStatus;

  @Field(() => Date, { nullable: true })
  receivedAt?: Date;

  @Field(() => [IncomeInstallmentResponseDto])
  installments!: IncomeInstallmentResponseDto[];

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
