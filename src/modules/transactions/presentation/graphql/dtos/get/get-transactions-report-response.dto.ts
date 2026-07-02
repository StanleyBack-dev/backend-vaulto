import { createDataResponseDto } from "@/common/responses/factories/create-data-response.dto";
import { TransactionsReportResponseDto } from "@/modules/transactions/presentation/graphql/dtos/get/transactions-report-response.dto";

export const GetTransactionsReportResponseDto = createDataResponseDto(
  TransactionsReportResponseDto,
  "GetTransactionsReportResponse",
);
