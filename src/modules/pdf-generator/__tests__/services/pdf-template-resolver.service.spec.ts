import { existsSync } from "node:fs";
import { PdfTemplateKey } from "../../enums/pdf-template-key.enum";
import { PdfTemplateResolverService } from "../../services/pdf-template-resolver.service";

describe("PdfTemplateResolverService", () => {
  it("should resolve existing template path", () => {
    const service = new PdfTemplateResolverService();
    const absolutePath = service.resolveTemplatePath(PdfTemplateKey.BUDGETS);

    expect(absolutePath).toContain("budgets.pdf");
    expect(existsSync(absolutePath)).toBe(true);
  });
});
