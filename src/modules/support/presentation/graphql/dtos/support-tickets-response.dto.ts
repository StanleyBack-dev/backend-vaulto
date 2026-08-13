import { Field, Int, ObjectType } from "@nestjs/graphql";
import type { PaginatedResult } from "@/common/responses/interfaces/response.interface";
import type { SupportTicketAdminView } from "@/modules/support/application/dto/support-ticket-admin-view.type";
import { SupportTicketResponseDto } from "@/modules/support/presentation/graphql/dtos/support-ticket-response.dto";

@ObjectType()
export class SupportTicketsResponseDto {
  static fromResult(
    result: PaginatedResult<SupportTicketAdminView>,
  ): SupportTicketsResponseDto {
    const dto = new SupportTicketsResponseDto();
    dto.items = result.items.map((item) =>
      SupportTicketResponseDto.fromView(item),
    );
    dto.total = result.total;
    dto.currentPage = result.currentPage;
    dto.limit = result.limit;
    dto.totalPages = result.totalPages;
    dto.hasNextPage = result.hasNextPage;
    return dto;
  }

  @Field(() => [SupportTicketResponseDto])
  items!: SupportTicketResponseDto[];

  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  currentPage!: number;

  @Field(() => Int)
  limit!: number;

  @Field(() => Int)
  totalPages!: number;

  @Field()
  hasNextPage!: boolean;
}
