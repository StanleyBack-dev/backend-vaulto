import { Body, Controller, Headers, HttpCode, Post } from "@nestjs/common";
import { Public } from "@/common/decorators/public.decorator";
import type { AsaasTransferApprovalPayload } from "@/modules/referrals/application/dto/webhook/asaas-transfer-approval-payload";
import { ApproveReferralWithdrawalTransferUseCase } from "@/modules/referrals/application/use-cases/approve-referral-withdrawal-transfer.use-case";

@Controller("webhooks/asaas/transfer-approval")
export class AsaasTransferApprovalWebhookController {
  constructor(
    private readonly approveReferralWithdrawalTransferUseCase: ApproveReferralWithdrawalTransferUseCase,
  ) {}

  @Public()
  @Post()
  @HttpCode(200)
  async handle(
    @Headers("asaas-access-token") accessToken: string | undefined,
    @Body() payload: AsaasTransferApprovalPayload,
  ) {
    const result = await this.approveReferralWithdrawalTransferUseCase.execute(
      accessToken,
      payload.transfer.id,
    );

    if (!result.approved) {
      return { status: "REFUSED", refuseReason: result.refuseReason };
    }

    return { status: "APPROVED" };
  }
}
