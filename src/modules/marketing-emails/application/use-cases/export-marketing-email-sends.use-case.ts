import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { formatDateBR } from "@/utils/pdf";
import { EXPORT_MIME_TYPE_BY_FORMAT } from "@/modules/exports/domain/constants/export.constant";
import { RenderTabularWorkbookService } from "@/modules/excel-generator/application/use-cases/render-tabular-workbook.use-case";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import { MARKETING_EMAIL_CATEGORY_LABELS } from "@/modules/marketing-emails/domain/constants/marketing-email-category-labels.constant";
import type { ListMarketingEmailSendsQuery } from "@/modules/marketing-emails/application/dto/list-marketing-email-sends.query";
import {
  MARKETING_EMAIL_REPOSITORY,
  type MarketingEmailRepositoryPort,
} from "@/modules/marketing-emails/application/ports/marketing-email-repository.port";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

export type ExportMarketingEmailSendsOutput = {
  filename: string;
  mimeType: string;
  base64: string;
};

// Deliberately bypasses ExportResourceUseCase (src/modules/exports) — that
// pipeline is gated by PlanLimitsService.assertProPlan, an end-user billing
// rule that doesn't apply to this internal admin report. Only the workbook
// renderer is reused.
@Injectable()
export class ExportMarketingEmailSendsUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(MARKETING_EMAIL_REPOSITORY)
    private readonly marketingEmailRepository: MarketingEmailRepositoryPort,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly workbookRenderer: RenderTabularWorkbookService,
  ) {}

  async execute(
    adminId: string,
    filters: Pick<ListMarketingEmailSendsQuery, "category" | "recipientEmail">,
  ): Promise<ExportMarketingEmailSendsOutput> {
    await this.authorizationService.assertPermissionForUserId(
      adminId,
      AuthPermission.READ_MARKETING_EMAILS,
    );

    const records = await this.marketingEmailRepository.listAll({
      category: filters.category,
      recipientEmail: filters.recipientEmail?.trim().toLowerCase() || undefined,
    });

    const uniqueAdminIds = [...new Set(records.map((r) => r.sentByAdminId))];
    const admins = uniqueAdminIds.length
      ? await this.userRepository.find({ where: { idUsers: In(uniqueAdminIds) } })
      : [];
    const adminsById = new Map(admins.map((admin) => [admin.idUsers, admin]));

    const rows = records.map((record) => [
      record.recipientName,
      record.recipientEmail,
      record.recipientPhone ?? "—",
      MARKETING_EMAIL_CATEGORY_LABELS[record.category],
      record.subject,
      typeof record.partnershipPercentage === "number"
        ? `${record.partnershipPercentage}%`
        : "—",
      formatDateBR(record.createdAt),
      adminsById.get(record.sentByAdminId)?.name ?? "—",
    ]);

    const buffer = await this.workbookRenderer.render({
      documentTitle: "Histórico de E-mails de Parceria",
      generatedAtLabel: `Gerado em ${formatDateBR(new Date())}`,
      userLabel: "Painel de Administração",
      columns: [
        { label: "Nome", weight: 2 },
        { label: "E-mail", weight: 3 },
        { label: "Celular", weight: 2 },
        { label: "Categoria", weight: 2 },
        { label: "Assunto", weight: 3 },
        { label: "% Parceria", weight: 1, align: "center" },
        { label: "Enviado em", weight: 1, align: "center" },
        { label: "Enviado por", weight: 2 },
      ],
      rows,
      totals: [],
      emptyStateLabel: "Nenhum e-mail encontrado para os filtros selecionados.",
      referenceCode: `EXP-MARKETING-EMAILS-${Date.now().toString(36).toUpperCase()}`,
    });

    const dateSlug = new Date().toISOString().slice(0, 10);

    return {
      filename: `emails-de-parceria-${dateSlug}.xlsx`,
      mimeType: EXPORT_MIME_TYPE_BY_FORMAT.XLSX,
      base64: buffer.toString("base64"),
    };
  }
}
