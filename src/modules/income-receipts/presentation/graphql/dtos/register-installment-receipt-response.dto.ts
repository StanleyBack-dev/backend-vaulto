import { Field, ObjectType } from "@nestjs/graphql";
import { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";
import { IncomeInstallmentResponseDto } from "@/modules/incomes/presentation/graphql/dtos/get/income-installment-response.dto";
import { IncomeReceiptResponseDto } from "@/modules/income-receipts/presentation/graphql/dtos/income-receipt-response.dto";
import type { RegisterInstallmentReceiptResult } from "@/modules/income-receipts/application/ports/income-receipt-repository.port";

@ObjectType()
export class RegisterInstallmentReceiptResponseDto {
  static fromResult(
    result: RegisterInstallmentReceiptResult,
  ): RegisterInstallmentReceiptResponseDto {
    const dto = new RegisterInstallmentReceiptResponseDto();
    dto.idIncome = result.idIncome;
    dto.incomeStatus = result.incomeStatus;
    dto.receipts = result.receipts.map((receipt) =>
      IncomeReceiptResponseDto.fromView(receipt),
    );
    dto.installments = result.installments.map((installment) =>
      IncomeInstallmentResponseDto.fromView(installment),
    );
    return dto;
  }

  @Field()
  idIncome!: string;

  @Field(() => IncomeStatus)
  incomeStatus!: IncomeStatus;

  @Field(() => [IncomeReceiptResponseDto])
  receipts!: IncomeReceiptResponseDto[];

  @Field(() => [IncomeInstallmentResponseDto])
  installments!: IncomeInstallmentResponseDto[];
}
