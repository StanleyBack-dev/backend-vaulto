import { Injectable } from "@nestjs/common";
import { readFile } from "node:fs/promises";
import { PDFDocument, rgb } from "pdf-lib";
import { PdfDrawText } from "../../domain/interfaces/pdf-draw-text.interface";
import { PdfTemplateKey } from "../../domain/enums/pdf-template-key.enum";
import { PdfTemplateResolverService } from "./pdf-template-resolver.use-case";

interface GeneratePdfFromTemplateInput {
  templateKey: PdfTemplateKey;
  drawTexts?: PdfDrawText[];
}

@Injectable()
export class PdfGeneratorService {
  constructor(
    private readonly pdfTemplateResolverUseCase: PdfTemplateResolverService,
  ) {}

  async generateFromTemplate(
    input: GeneratePdfFromTemplateInput,
  ): Promise<Buffer> {
    const absolutePath = this.pdfTemplateResolverUseCase.resolveTemplatePath(
      input.templateKey,
    );
    const templateBytes = await readFile(absolutePath);
    const pdfDoc = await PDFDocument.load(templateBytes);

    for (const drawText of input.drawTexts ?? []) {
      const page = pdfDoc.getPage(drawText.pageIndex ?? 0);

      if (drawText.clearBefore && drawText.clearWidth && drawText.clearHeight) {
        page.drawRectangle({
          x: drawText.x,
          y: drawText.y,
          width: drawText.clearWidth,
          height: drawText.clearHeight,
          color: rgb(1, 1, 1),
          borderWidth: 0,
        });
      }

      page.drawText(drawText.text, {
        x: drawText.x,
        y: drawText.y,
        size: drawText.fontSize ?? 10,
        color: rgb(0, 0, 0),
      });
    }

    const generated = await pdfDoc.save();
    return Buffer.from(generated);
  }
}
