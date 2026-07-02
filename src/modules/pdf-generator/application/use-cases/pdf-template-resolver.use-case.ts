import { Injectable } from "@nestjs/common";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { PdfTemplateKey } from "../../domain/enums/pdf-template-key.enum";

const TEMPLATE_FILE_BY_KEY: Record<PdfTemplateKey, string> = {
  [PdfTemplateKey.BUDGETS]: "budgets.pdf",
  [PdfTemplateKey.CONTRACTS]: "budgets.pdf",
};

@Injectable()
export class PdfTemplateResolverService {
  resolveTemplatePath(templateKey: PdfTemplateKey): string {
    const templateFile = TEMPLATE_FILE_BY_KEY[templateKey];

    if (!templateFile) {
      throw AppException.from(APP_ERRORS.pdf.templateNotMapped, undefined);
    }

    const absolutePath = resolve(
      process.cwd(),
      "src/modules/pdf-generator/presentation/templates",
      templateFile,
    );

    if (!existsSync(absolutePath)) {
      throw AppException.from(APP_ERRORS.pdf.templateNotFound, undefined, {
        templateKey,
      });
    }

    return absolutePath;
  }
}
