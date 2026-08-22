import { Field, Int, ObjectType } from "@nestjs/graphql";
import type { PaginatedResult } from "@/common/responses/interfaces/response.interface";
import type { MarketingEmailSendAdminView } from "@/modules/marketing-emails/application/dto/marketing-email-send-admin-view.type";
import { MarketingEmailSendResponseDto } from "@/modules/marketing-emails/presentation/graphql/dtos/marketing-email-send-response.dto";

@ObjectType()
export class MarketingEmailSendsResponseDto {
  static fromResult(
    result: PaginatedResult<MarketingEmailSendAdminView>,
  ): MarketingEmailSendsResponseDto {
    const dto = new MarketingEmailSendsResponseDto();
    dto.items = result.items.map((item) =>
      MarketingEmailSendResponseDto.fromView(item),
    );
    dto.total = result.total;
    dto.currentPage = result.currentPage;
    dto.limit = result.limit;
    dto.totalPages = result.totalPages;
    dto.hasNextPage = result.hasNextPage;
    return dto;
  }

  @Field(() => [MarketingEmailSendResponseDto])
  items!: MarketingEmailSendResponseDto[];

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
