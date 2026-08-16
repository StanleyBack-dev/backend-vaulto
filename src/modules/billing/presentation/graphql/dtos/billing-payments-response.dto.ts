import { Field, Int, ObjectType } from "@nestjs/graphql";
import type { PaginatedResult } from "@/common/responses/interfaces/response.interface";
import type { BillingPaymentView } from "@/modules/billing/application/ports/billing-payment-repository.port";
import { BillingPaymentResponseDto } from "@/modules/billing/presentation/graphql/dtos/billing-payment-response.dto";

@ObjectType()
export class BillingPaymentsResponseDto {
  static fromResult(
    result: PaginatedResult<BillingPaymentView>,
  ): BillingPaymentsResponseDto {
    const dto = new BillingPaymentsResponseDto();
    dto.items = result.items.map((item) =>
      BillingPaymentResponseDto.fromView(item),
    );
    dto.total = result.total;
    dto.currentPage = result.currentPage;
    dto.limit = result.limit;
    dto.totalPages = result.totalPages;
    dto.hasNextPage = result.hasNextPage;
    return dto;
  }

  @Field(() => [BillingPaymentResponseDto])
  items!: BillingPaymentResponseDto[];

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
