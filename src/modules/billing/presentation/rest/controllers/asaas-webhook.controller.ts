import { Body, Controller, Headers, HttpCode, Post } from "@nestjs/common";
import { Public } from "@/common/decorators/public.decorator";
import type { AsaasWebhookPayload } from "@/modules/billing/application/dto/webhook/asaas-webhook-payload";
import { HandleAsaasWebhookUseCase } from "@/modules/billing/application/use-cases/webhook/handle-asaas-webhook.use-case";

@Controller("webhooks/asaas")
export class AsaasWebhookController {
  constructor(
    private readonly handleAsaasWebhookUseCase: HandleAsaasWebhookUseCase,
  ) {}

  @Public()
  @Post()
  @HttpCode(200)
  async handle(
    @Headers("asaas-access-token") accessToken: string | undefined,
    @Body() payload: AsaasWebhookPayload,
  ) {
    await this.handleAsaasWebhookUseCase.execute(accessToken, payload);
    return { received: true };
  }
}
