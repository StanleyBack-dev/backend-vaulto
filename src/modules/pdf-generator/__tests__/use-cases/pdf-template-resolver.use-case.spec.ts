import { existsSync } from "node:fs";
import { PdfTemplateKey } from "../../domain/enums/pdf-template-key.enum";
import { PdfTemplateResolverService } from "../../application/use-cases/pdf-template-resolver.use-case";

describe("PdfTemplateResolverService", () => {
  it("should resolve existing template path", () => {
    const service = new PdfTemplateResolverService();
    const absolutePath = service.resolveTemplatePath(PdfTemplateKey.BUDGETS);

    expect(absolutePath).toContain("budgets.pdf");
    expect(existsSync(absolutePath)).toBe(true);
  });
});
