import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { PageAccessKey } from "@/modules/auth/domain/enums/page-access-key.enum";
import { RequirePermissions } from "@/modules/auth/presentation/decorators/require-permissions.decorator";
import { RequirePageAccess } from "@/modules/auth/presentation/decorators/require-page-access.decorator";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { ExportMarketingEmailSendsUseCase } from "@/modules/marketing-emails/application/use-cases/export-marketing-email-sends.use-case";
import { GetMarketingEmailDefaultTemplateUseCase } from "@/modules/marketing-emails/application/use-cases/get-marketing-email-default-template.use-case";
import { GetMarketingEmailRecipientCooldownUseCase } from "@/modules/marketing-emails/application/use-cases/get-marketing-email-recipient-cooldown.use-case";
import { ListMarketingEmailSendsUseCase } from "@/modules/marketing-emails/application/use-cases/list-marketing-email-sends.use-case";
import { PreviewMarketingEmailUseCase } from "@/modules/marketing-emails/application/use-cases/preview-marketing-email.use-case";
import { SendMarketingEmailUseCase } from "@/modules/marketing-emails/application/use-cases/send-marketing-email.use-case";
import { ListMarketingEmailSendsInputDto } from "@/modules/marketing-emails/presentation/graphql/dtos/list-marketing-email-sends-input.dto";
import { MarketingEmailCooldownResponseDto } from "@/modules/marketing-emails/presentation/graphql/dtos/marketing-email-cooldown-response.dto";
import { MarketingEmailDefaultTemplateResponseDto } from "@/modules/marketing-emails/presentation/graphql/dtos/marketing-email-default-template-response.dto";
import { MarketingEmailPreviewResponseDto } from "@/modules/marketing-emails/presentation/graphql/dtos/marketing-email-preview-response.dto";
import { MarketingEmailSendResponseDto } from "@/modules/marketing-emails/presentation/graphql/dtos/marketing-email-send-response.dto";
import { MarketingEmailSendsExportResponseDto } from "@/modules/marketing-emails/presentation/graphql/dtos/marketing-email-sends-export-response.dto";
import { MarketingEmailSendsResponseDto } from "@/modules/marketing-emails/presentation/graphql/dtos/marketing-email-sends-response.dto";
import { PreviewMarketingEmailInputDto } from "@/modules/marketing-emails/presentation/graphql/dtos/preview-marketing-email-input.dto";
import { SendMarketingEmailInputDto } from "@/modules/marketing-emails/presentation/graphql/dtos/send-marketing-email-input.dto";
import "@/modules/marketing-emails/presentation/graphql/enums/marketing-email-graphql.enums";

@Resolver()
@RequirePageAccess(PageAccessKey.ADMIN)
export class MarketingEmailResolver {
  constructor(
    private readonly getMarketingEmailDefaultTemplateUseCase: GetMarketingEmailDefaultTemplateUseCase,
    private readonly previewMarketingEmailUseCase: PreviewMarketingEmailUseCase,
    private readonly getMarketingEmailRecipientCooldownUseCase: GetMarketingEmailRecipientCooldownUseCase,
    private readonly listMarketingEmailSendsUseCase: ListMarketingEmailSendsUseCase,
    private readonly sendMarketingEmailUseCase: SendMarketingEmailUseCase,
    private readonly exportMarketingEmailSendsUseCase: ExportMarketingEmailSendsUseCase,
  ) {}

  @Query(() => MarketingEmailDefaultTemplateResponseDto, {
    name: "marketingEmailDefaultTemplate",
  })
  @RequirePermissions(AuthPermission.READ_MARKETING_EMAILS)
  async marketingEmailDefaultTemplate(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.getMarketingEmailDefaultTemplateUseCase.execute(
      user.idUsers,
    );

    return MarketingEmailDefaultTemplateResponseDto.fromResult(result);
  }

  @Query(() => MarketingEmailPreviewResponseDto, {
    name: "previewMarketingEmail",
  })
  @RequirePermissions(AuthPermission.READ_MARKETING_EMAILS)
  async previewMarketingEmail(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: PreviewMarketingEmailInputDto,
  ) {
    const result = await this.previewMarketingEmailUseCase.execute(
      user.idUsers,
      {
        subject: input.subject,
        bodyMarkdown: input.bodyMarkdown,
        recipientName: input.recipientName,
        partnershipPercentage: input.partnershipPercentage,
      },
    );

    return MarketingEmailPreviewResponseDto.fromResult(result);
  }

  @Query(() => MarketingEmailCooldownResponseDto, {
    name: "marketingEmailRecipientCooldown",
  })
  @RequirePermissions(AuthPermission.READ_MARKETING_EMAILS)
  async marketingEmailRecipientCooldown(
    @CurrentUser() user: AuthenticatedUser,
    @Args("email") email: string,
  ) {
    const result = await this.getMarketingEmailRecipientCooldownUseCase.execute(
      user.idUsers,
      email,
    );

    return MarketingEmailCooldownResponseDto.fromResult(result);
  }

  @Query(() => MarketingEmailSendsResponseDto, {
    name: "listMarketingEmailSends",
  })
  @RequirePermissions(AuthPermission.READ_MARKETING_EMAILS)
  async listMarketingEmailSends(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input", { nullable: true }) input?: ListMarketingEmailSendsInputDto,
  ) {
    const result = await this.listMarketingEmailSendsUseCase.execute(
      user.idUsers,
      {
        page: input?.page,
        limit: input?.limit,
        category: input?.category,
        recipientEmail: input?.recipientEmail,
      },
    );

    return MarketingEmailSendsResponseDto.fromResult(result);
  }

  @Query(() => MarketingEmailSendsExportResponseDto, {
    name: "exportMarketingEmailSends",
  })
  @RequirePermissions(AuthPermission.READ_MARKETING_EMAILS)
  async exportMarketingEmailSends(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input", { nullable: true }) input?: ListMarketingEmailSendsInputDto,
  ) {
    const result = await this.exportMarketingEmailSendsUseCase.execute(
      user.idUsers,
      { category: input?.category, recipientEmail: input?.recipientEmail },
    );

    return MarketingEmailSendsExportResponseDto.fromOutput(result);
  }

  @Mutation(() => MarketingEmailSendResponseDto, { name: "sendMarketingEmail" })
  @RequirePermissions(AuthPermission.MANAGE_MARKETING_EMAILS)
  async sendMarketingEmail(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: SendMarketingEmailInputDto,
  ) {
    const result = await this.sendMarketingEmailUseCase.execute(user.idUsers, {
      category: input.category,
      recipientEmail: input.recipientEmail,
      recipientName: input.recipientName,
      recipientPhone: input.recipientPhone,
      subject: input.subject,
      bodyMarkdown: input.bodyMarkdown,
      partnershipPercentage: input.partnershipPercentage,
    });

    return MarketingEmailSendResponseDto.fromView(result);
  }
}
