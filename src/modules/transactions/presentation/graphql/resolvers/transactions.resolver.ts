import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { RESPONSE_MESSAGES } from "@/common/responses/catalogs/response-messages.catalog";
import {
  buildDataResponse,
  buildPaginatedListResponse,
} from "@/common/responses/helpers/response.helper";
import { RequirePermissions } from "@/modules/auth/presentation/decorators/require-permissions.decorator";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { CreateTransactionUseCase } from "@/modules/transactions/application/use-cases/create/create-transaction.use-case";
import { GetTransactionsReportUseCase } from "@/modules/transactions/application/use-cases/get/get-transactions-report.use-case";
import { ListTransactionsUseCase } from "@/modules/transactions/application/use-cases/get/list-transactions.use-case";
import { CreateTransactionInputDto } from "@/modules/transactions/presentation/graphql/dtos/create/create-transaction-input.dto";
import { CreateTransactionMutationResponseDto } from "@/modules/transactions/presentation/graphql/dtos/create/create-transaction-mutation-response.dto";
import { GetTransactionsReportInputDto } from "@/modules/transactions/presentation/graphql/dtos/get/get-transactions-report-input.dto";
import { GetTransactionsReportResponseDto } from "@/modules/transactions/presentation/graphql/dtos/get/get-transactions-report-response.dto";
import { ListTransactionsInputDto } from "@/modules/transactions/presentation/graphql/dtos/get/list-transactions-input.dto";
import { ListTransactionsResponseDto } from "@/modules/transactions/presentation/graphql/dtos/get/list-transactions-response.dto";
import { TransactionsReportResponseDto } from "@/modules/transactions/presentation/graphql/dtos/get/transactions-report-response.dto";
import { TransactionResponseDto } from "@/modules/transactions/presentation/graphql/dtos/get/transaction-response.dto";

@Resolver()
export class TransactionsResolver {
  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    private readonly listTransactionsUseCase: ListTransactionsUseCase,
    private readonly getTransactionsReportUseCase: GetTransactionsReportUseCase,
  ) {}

  @Mutation(() => CreateTransactionMutationResponseDto, {
    name: "createTransaction",
  })
  @RequirePermissions(AuthPermission.MANAGE_OWN_TRANSACTIONS)
  async createTransaction(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: CreateTransactionInputDto,
  ) {
    const created = await this.createTransactionUseCase.execute(user.idUsers, {
      idAccount: input.idAccount,
      type: input.type,
      amount: input.amount,
      description: input.description,
      occurredAt: input.occurredAt,
    });

    return buildDataResponse(
      TransactionResponseDto.fromView(created),
      RESPONSE_MESSAGES.transactions.created,
    );
  }

  @Query(() => ListTransactionsResponseDto, { name: "getMyTransactions" })
  @RequirePermissions(AuthPermission.READ_OWN_TRANSACTIONS)
  async getMyTransactions(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input", { nullable: true }) input?: ListTransactionsInputDto,
  ) {
    const result = await this.listTransactionsUseCase.execute(user.idUsers, input);

    return buildPaginatedListResponse(
      {
        ...result,
        items: result.items.map((item) => TransactionResponseDto.fromView(item)),
      },
      RESPONSE_MESSAGES.transactions.listed,
    );
  }

  @Query(() => GetTransactionsReportResponseDto, { name: "getMyTransactionsReport" })
  @RequirePermissions(AuthPermission.READ_OWN_TRANSACTIONS)
  async getMyTransactionsReport(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input", { nullable: true }) input?: GetTransactionsReportInputDto,
  ) {
    const report = await this.getTransactionsReportUseCase.execute(user.idUsers, input);

    return buildDataResponse(
      TransactionsReportResponseDto.fromView(report),
      RESPONSE_MESSAGES.transactions.reported,
    );
  }
}


