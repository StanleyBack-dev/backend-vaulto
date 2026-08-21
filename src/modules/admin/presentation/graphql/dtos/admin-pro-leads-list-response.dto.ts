import { createListResponseDto } from "@/common/responses/factories/create-list-response.dto";
import { AdminProLeadRowDto } from "./admin-pro-lead-row.dto";

export const AdminProLeadsListResponseDto = createListResponseDto(
  AdminProLeadRowDto,
  "AdminProLeadsListResponseDto",
);
