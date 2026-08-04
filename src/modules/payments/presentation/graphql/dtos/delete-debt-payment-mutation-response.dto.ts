import { createDataResponseDto } from "@/common/responses/factories/create-data-response.dto";
import { RegisterInstallmentPaymentResponseDto } from "@/modules/payments/presentation/graphql/dtos/register-installment-payment-response.dto";

export const DeleteDebtPaymentMutationResponseDto = createDataResponseDto(
  RegisterInstallmentPaymentResponseDto,
  "DeleteDebtPaymentMutationResponseDto",
);
