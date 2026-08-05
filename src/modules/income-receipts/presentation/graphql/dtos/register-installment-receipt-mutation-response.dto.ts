import { createDataResponseDto } from "@/common/responses/factories/create-data-response.dto";
import { RegisterInstallmentReceiptResponseDto } from "@/modules/income-receipts/presentation/graphql/dtos/register-installment-receipt-response.dto";

export const RegisterInstallmentReceiptMutationResponseDto =
  createDataResponseDto(
    RegisterInstallmentReceiptResponseDto,
    "RegisterInstallmentReceiptMutationResponseDto",
  );
