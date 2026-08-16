import { Inject, Injectable } from "@nestjs/common";
import {
  calculateHasNextPage,
  calculateTotalPages,
  resolvePagination,
} from "@/common/responses/helpers/pagination.helper";
import type { PaginatedResult } from "@/common/responses/interfaces/response.interface";
import {
  BILLING_PAYMENT_REPOSITORY,
  type BillingPaymentRepositoryPort,
  type BillingPaymentView,
} from "@/modules/billing/application/ports/billing-payment-repository.port";

export interface ListMyBillingPaymentsQuery {
  page?: number;
  limit?: number;
}

@Injectable()
export class ListMyBillingPaymentsUseCase {
  constructor(
    @Inject(BILLING_PAYMENT_REPOSITORY)
    private readonly billingPaymentRepository: BillingPaymentRepositoryPort,
  ) {}

  async execute(
    idUsers: string,
    query?: ListMyBillingPaymentsQuery,
  ): Promise<PaginatedResult<BillingPaymentView>> {
    const { page, limit } = resolvePagination(query?.page, query?.limit);

    const { records, total } = await this.billingPaymentRepository.listByUser(
      idUsers,
      { page, limit },
    );

    return {
      items: records,
      total,
      currentPage: page,
      limit,
      totalPages: calculateTotalPages(limit, total),
      hasNextPage: calculateHasNextPage(page, limit, total),
    };
  }
}
