import { Field, ObjectType } from "@nestjs/graphql";
import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";
import { DebtInstallmentResponseDto } from "@/modules/debts/presentation/graphql/dtos/get/debt-installment-response.dto";
import { DebtPaymentResponseDto } from "@/modules/debts/presentation/graphql/dtos/get/debt-payment-response.dto";
import type { RegisterInstallmentPaymentResult } from "@/modules/payments/application/ports/payment-repository.port";

@ObjectType()
export class RegisterInstallmentPaymentResponseDto {
  static fromResult(
    result: RegisterInstallmentPaymentResult,
  ): RegisterInstallmentPaymentResponseDto {
    const dto = new RegisterInstallmentPaymentResponseDto();
    dto.idDebt = result.idDebt;
    dto.debtStatus = result.debtStatus;
    dto.payments = result.payments.map((payment) =>
      DebtPaymentResponseDto.fromView(payment),
    );
    dto.installments = result.installments.map((installment) =>
      DebtInstallmentResponseDto.fromView(installment),
    );
    return dto;
  }

  @Field()
  idDebt!: string;

  @Field(() => DebtStatus)
  debtStatus!: DebtStatus;

  @Field(() => [DebtPaymentResponseDto])
  payments!: DebtPaymentResponseDto[];

  @Field(() => [DebtInstallmentResponseDto])
  installments!: DebtInstallmentResponseDto[];
}
