import { Field, Float, Int, ObjectType } from "@nestjs/graphql";
import type { DebtView } from "@/modules/debts/application/ports/debt-repository.port";
import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";
import { DebtType } from "@/modules/debts/domain/enums/debt-type.enum";
import { DebtInstallmentResponseDto } from "@/modules/debts/presentation/graphql/dtos/get/debt-installment-response.dto";
import { DebtPaymentResponseDto } from "@/modules/debts/presentation/graphql/dtos/get/debt-payment-response.dto";

@ObjectType()
export class DebtResponseDto {
  static fromView(view: DebtView): DebtResponseDto {
    const dto = new DebtResponseDto();
    dto.idDebt = view.idDebt;
    dto.idUsers = view.idUsers;
    dto.idAccount = view.idAccount;
    dto.title = view.title;
    dto.description = view.description;
    dto.debtType = view.debtType;
    dto.totalAmount = view.totalAmount;
    dto.startDate = view.startDate;
    dto.hasInstallments = view.hasInstallments;
    dto.installmentCount = view.installmentCount;
    dto.status = view.status;
    dto.settledAt = view.settledAt;
    dto.installments = view.installments.map((installment) =>
      DebtInstallmentResponseDto.fromView(installment),
    );
    dto.payments = view.payments.map((payment) =>
      DebtPaymentResponseDto.fromView(payment),
    );
    dto.createdAt = view.createdAt;
    dto.updatedAt = view.updatedAt;
    return dto;
  }

  @Field()
  idDebt!: string;

  @Field()
  idUsers!: string;

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

  @Field(() => Int)
  installmentCount!: number;

  @Field(() => DebtStatus)
  status!: DebtStatus;

  @Field(() => Date, { nullable: true })
  settledAt?: Date;

  @Field(() => [DebtInstallmentResponseDto])
  installments!: DebtInstallmentResponseDto[];

  @Field(() => [DebtPaymentResponseDto])
  payments!: DebtPaymentResponseDto[];

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
