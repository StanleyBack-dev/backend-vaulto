import { Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { PdfTemplateKey } from "../../domain/enums/pdf-template-key.enum";
import { PdfTemplateRenderer } from "../interfaces/pdf-template-renderer.interface";
import { RenderBudgetProposalTemplateService } from "../../presentation/templates/budgets/render-budget-proposal-template.service";
import { RenderContractTemplateService } from "../../presentation/templates/contracts/render-contract-template.service";

interface GenerateByTemplateInput<TPayload> {
  templateKey: PdfTemplateKey;
  payload: TPayload;
}

@Injectable()
export class PdfTemplateEngineService {
  private readonly registry: Map<PdfTemplateKey, PdfTemplateRenderer>;

  constructor(
    private readonly renderBudgetProposalTemplateUseCase: RenderBudgetProposalTemplateService,
    private readonly renderContractTemplateUseCase: RenderContractTemplateService,
  ) {
    this.registry = new Map<PdfTemplateKey, PdfTemplateRenderer>([
      [
        this.renderBudgetProposalTemplateUseCase.templateKey,
        this.renderBudgetProposalTemplateUseCase,
      ],
      [
        this.renderContractTemplateUseCase.templateKey,
        this.renderContractTemplateUseCase,
      ],
    ]);
  }

  async generateByTemplate<TPayload>(
    input: GenerateByTemplateInput<TPayload>,
  ): Promise<Buffer> {
    const renderer = this.registry.get(input.templateKey);

    if (!renderer) {
      throw AppException.from(APP_ERRORS.pdf.templateNotMapped, undefined);
    }

    return renderer.render(input.payload);
  }
}
