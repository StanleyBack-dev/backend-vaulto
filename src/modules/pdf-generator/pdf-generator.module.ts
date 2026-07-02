import { Module } from "@nestjs/common";
import { PdfGeneratorService } from "./application/use-cases/pdf-generator.use-case";
import { PdfTemplateResolverService } from "./application/use-cases/pdf-template-resolver.use-case";
import { PdfSnapshotHashService } from "./application/use-cases/pdf-snapshot-hash.use-case";
import { PdfTemplateEngineService } from "./application/use-cases/pdf-template-engine.use-case";
import { RenderBudgetProposalTemplateService } from "./presentation/templates/budgets/render-budget-proposal-template.service";
import { RenderContractTemplateService } from "./presentation/templates/contracts/render-contract-template.service";

@Module({
  providers: [
    PdfGeneratorService,
    PdfTemplateResolverService,
    PdfSnapshotHashService,
    PdfTemplateEngineService,
    RenderBudgetProposalTemplateService,
    RenderContractTemplateService,
  ],
  exports: [
    PdfGeneratorService,
    PdfTemplateResolverService,
    PdfSnapshotHashService,
    PdfTemplateEngineService,
  ],
})
export class PdfGeneratorModule {}


