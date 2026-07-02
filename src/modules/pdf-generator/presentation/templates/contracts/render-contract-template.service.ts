import { Injectable } from "@nestjs/common";
import {
  PDFDocument,
  PDFImage,
  PDFFont,
  PDFPage,
  StandardFonts,
  Color,
} from "pdf-lib";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  PDF_COLORS,
  PDF_FONT_SIZES,
  PDF_LAYOUT,
} from "../../../infrastructure/design-system/pdf-design-system";
import { PdfTemplateKey } from "../../../domain/enums/pdf-template-key.enum";
import { PdfTemplateRenderer } from "../../../application/interfaces/pdf-template-renderer.interface";
import {
  ContractPdfPayload,
  ContractPdfPayloadParty,
} from "./interfaces/contract-pdf-payload.interface";
import { wrapText } from "@/utils/pdf";

const HEADER_HEIGHT = 68;
const LOGO_BOX_WIDTH = 80;
const LOGO_BOX_HEIGHT = 48;
const META_BOX_WIDTH = 180;
const HEADER_DIVIDER_Y = PDF_LAYOUT.pageHeight - 126;
const CONTENT_START_Y = HEADER_DIVIDER_Y - 22;
const FOOTER_RESERVED_HEIGHT = 68;
const SECTION_TITLE_SIZE = 9;
const SECTION_TITLE_GAP = 11;
const PARTY_CARD_GAP = 8;
const PARTY_ROLE_SIZE = 6.5;
const PARTY_TEXT_SIZE = 7.2;
const PARTY_LINE_HEIGHT = 8.2;
const BODY_TEXT_SIZE = 7.6;
const BODY_LINE_HEIGHT = 8.6;
const CLAUSE_TITLE_SIZE = 8.2;
const CLAUSE_TITLE_LINE_HEIGHT = 9.2;
const PARAGRAPH_GAP = 2;
const BODY_INSET_X = 12;
const BODY_FIRST_PARAGRAPH_GAP = 7;
const FINAL_SECTION_TOP_GAP = 10;
const FINAL_SECTION_PADDING_X = 12;
const FINAL_SECTION_PADDING_Y = 10;
const FINAL_SECTION_LINE_GAP = 3;
const LOGO_IMAGE_PATH = resolve(process.cwd(), "src/assets/images/logo.png");

interface FontSet {
  regular: PDFFont;
  bold: PDFFont;
}

interface HeaderAssets {
  logo?: PDFImage;
}

interface RenderState {
  document: PDFDocument;
  page: PDFPage;
  pages: PDFPage[];
  cursorY: number;
}

@Injectable()
export class RenderContractTemplateService implements PdfTemplateRenderer<ContractPdfPayload> {
  readonly templateKey = PdfTemplateKey.CONTRACTS;

  async render(payload: ContractPdfPayload): Promise<Buffer> {
    const document = await PDFDocument.create();
    const fonts = await this.loadFonts(document);
    const headerAssets = await this.loadHeaderAssets(document);
    const state = this.createState(document);

    this.drawHeader(state.page, fonts, payload, headerAssets);
    state.cursorY = CONTENT_START_Y;

    this.drawSectionTitle(state, fonts, "Partes");
    this.drawParties(state, fonts, payload.parties);

    if (payload.objectParagraphs.length) {
      this.drawSectionTitle(state, fonts, "Objeto", { topSpacing: 18 });
      this.drawParagraphs(state, fonts, payload.objectParagraphs);
    }

    if (payload.clauses.length) {
      this.drawSectionTitle(state, fonts, "Clausulas");
      this.drawClauses(state, fonts, payload.clauses);
    }

    for (let index = 0; index < state.pages.length; index += 1) {
      this.drawFooter(
        state.pages[index],
        fonts,
        payload,
        `${index + 1}/${state.pages.length}`,
      );
    }

    const pdfBytes = await document.save();
    return Buffer.from(pdfBytes);
  }

  private async loadFonts(document: PDFDocument): Promise<FontSet> {
    const [regular, bold] = await Promise.all([
      document.embedFont(StandardFonts.Helvetica),
      document.embedFont(StandardFonts.HelveticaBold),
    ]);

    return { regular, bold };
  }

  private async loadHeaderAssets(document: PDFDocument): Promise<HeaderAssets> {
    try {
      const logoBytes = await readFile(LOGO_IMAGE_PATH);
      const logo = await document.embedPng(logoBytes);
      return { logo };
    } catch {
      return {};
    }
  }

  private createState(document: PDFDocument): RenderState {
    const page = document.addPage([
      PDF_LAYOUT.pageWidth,
      PDF_LAYOUT.pageHeight,
    ]);
    this.paintPageBackground(page);

    return {
      document,
      page,
      pages: [page],
      cursorY: CONTENT_START_Y,
    };
  }

  private paintPageBackground(page: PDFPage) {
    page.drawRectangle({
      x: 0,
      y: 0,
      width: PDF_LAYOUT.pageWidth,
      height: PDF_LAYOUT.pageHeight,
      color: PDF_COLORS.white,
    });

    page.drawRectangle({
      x: 0,
      y: PDF_LAYOUT.pageHeight - HEADER_HEIGHT,
      width: PDF_LAYOUT.pageWidth,
      height: HEADER_HEIGHT,
      color: PDF_COLORS.bgLight,
    });

    page.drawRectangle({
      x: 0,
      y: PDF_LAYOUT.pageHeight - 6,
      width: PDF_LAYOUT.pageWidth,
      height: 6,
      color: PDF_COLORS.gold,
    });
  }

  private addPage(state: RenderState) {
    const page = state.document.addPage([
      PDF_LAYOUT.pageWidth,
      PDF_LAYOUT.pageHeight,
    ]);
    this.paintPageBackground(page);
    state.page = page;
    state.pages.push(page);
    state.cursorY = CONTENT_START_Y;
  }

  private ensureSpace(state: RenderState, requiredHeight: number) {
    if (state.cursorY - requiredHeight < FOOTER_RESERVED_HEIGHT) {
      this.addPage(state);
    }
  }

  private drawHeader(
    page: PDFPage,
    fonts: FontSet,
    payload: ContractPdfPayload,
    headerAssets: HeaderAssets,
  ) {
    const logoX = PDF_LAYOUT.marginX;
    const logoY = PDF_LAYOUT.pageHeight - 86;

    page.drawRectangle({
      x: logoX,
      y: logoY,
      width: LOGO_BOX_WIDTH,
      height: LOGO_BOX_HEIGHT,
      borderColor: PDF_COLORS.gold,
      borderWidth: 1.2,
      color: PDF_COLORS.white,
    });

    if (headerAssets.logo) {
      this.drawLogoImage(page, headerAssets.logo, logoX, logoY);
    } else {
      page.drawText(payload.logoPlaceholderLabel, {
        x: logoX + 12,
        y: logoY + 21,
        font: fonts.bold,
        size: PDF_FONT_SIZES.small,
        color: PDF_COLORS.textMuted,
      });
    }

    const textX = logoX + LOGO_BOX_WIDTH + 16;
    page.drawText(payload.companyName, {
      x: textX,
      y: PDF_LAYOUT.pageHeight - 62,
      font: fonts.bold,
      size: 20,
      color: PDF_COLORS.text,
    });

    page.drawText(payload.companySubtitle, {
      x: textX,
      y: PDF_LAYOUT.pageHeight - 78,
      font: fonts.regular,
      size: PDF_FONT_SIZES.small,
      color: PDF_COLORS.textMuted,
    });

    page.drawText(payload.documentSubtitle, {
      x: textX,
      y: PDF_LAYOUT.pageHeight - 90,
      font: fonts.regular,
      size: PDF_FONT_SIZES.small,
      color: PDF_COLORS.textMuted,
    });

    const metaBoxX = PDF_LAYOUT.pageWidth - PDF_LAYOUT.marginX - META_BOX_WIDTH;
    const metaBoxY = PDF_LAYOUT.pageHeight - 96;
    page.drawRectangle({
      x: metaBoxX,
      y: metaBoxY,
      width: META_BOX_WIDTH,
      height: 62,
      borderColor: PDF_COLORS.border,
      borderWidth: 1,
      color: PDF_COLORS.white,
    });

    let metaY = metaBoxY + 44;
    for (const detail of payload.metadata) {
      page.drawText(`${detail.label}:`, {
        x: metaBoxX + 10,
        y: metaY,
        font: fonts.bold,
        size: PDF_FONT_SIZES.small,
        color: PDF_COLORS.text,
      });

      page.drawText(detail.value, {
        x: metaBoxX + 74,
        y: metaY,
        font: fonts.regular,
        size: PDF_FONT_SIZES.small,
        color: PDF_COLORS.textMuted,
      });

      metaY -= 12;
      if (metaY < metaBoxY + 8) {
        break;
      }
    }

    page.drawLine({
      start: { x: PDF_LAYOUT.marginX, y: HEADER_DIVIDER_Y },
      end: {
        x: PDF_LAYOUT.pageWidth - PDF_LAYOUT.marginX,
        y: HEADER_DIVIDER_Y,
      },
      thickness: 1,
      color: PDF_COLORS.border,
    });

    const documentTitle = payload.documentTitle.toUpperCase();
    const documentTitleSize = 14;
    const documentTitleWidth = fonts.bold.widthOfTextAtSize(
      documentTitle,
      documentTitleSize,
    );
    const documentTitleX = (PDF_LAYOUT.pageWidth - documentTitleWidth) / 2;

    page.drawText(documentTitle, {
      x: documentTitleX,
      y: HEADER_DIVIDER_Y + 12,
      font: fonts.bold,
      size: documentTitleSize,
      color: PDF_COLORS.goldDark,
    });
  }

  private drawLogoImage(
    page: PDFPage,
    logo: PDFImage,
    logoX: number,
    logoY: number,
  ) {
    const inset = 4;
    const availableWidth = LOGO_BOX_WIDTH - inset * 2;
    const availableHeight = LOGO_BOX_HEIGHT - inset * 2;
    const scale = Math.min(
      availableWidth / logo.width,
      availableHeight / logo.height,
    );
    const width = logo.width * scale;
    const height = logo.height * scale;
    const x = logoX + (LOGO_BOX_WIDTH - width) / 2;
    const y = logoY + (LOGO_BOX_HEIGHT - height) / 2;

    page.drawImage(logo, {
      x,
      y,
      width,
      height,
    });
  }

  private drawSectionTitle(
    state: RenderState,
    fonts: FontSet,
    title: string,
    options?: { topSpacing?: number },
  ) {
    const topSpacing = options?.topSpacing ?? 0;
    this.ensureSpace(state, 14 + topSpacing);
    if (topSpacing > 0) {
      state.cursorY -= topSpacing;
    }

    state.page.drawText(title.toUpperCase(), {
      x: PDF_LAYOUT.marginX,
      y: state.cursorY,
      font: fonts.bold,
      size: SECTION_TITLE_SIZE,
      color: PDF_COLORS.text,
    });

    state.page.drawRectangle({
      x: PDF_LAYOUT.marginX,
      y: state.cursorY - 4,
      width: PDF_LAYOUT.contentWidth * 0.15,
      height: 2,
      color: PDF_COLORS.gold,
    });

    state.cursorY -= SECTION_TITLE_GAP;
  }

  private drawParties(
    state: RenderState,
    fonts: FontSet,
    parties: ContractPdfPayloadParty[],
  ) {
    const cardGap = PARTY_CARD_GAP;
    const cardWidth = (PDF_LAYOUT.contentWidth - cardGap) / 2;

    for (let index = 0; index < parties.length; index += 2) {
      const rowParties = parties.slice(index, index + 2);
      const cardData = rowParties.map((party) => {
        const details = [
          party.name,
          party.document ? `Documento: ${party.document}` : undefined,
        ].filter((value): value is string => Boolean(value));

        const lines = details.flatMap((detail) =>
          wrapText(detail, cardWidth - 16, fonts.regular, PARTY_TEXT_SIZE),
        );

        return {
          party,
          lines,
          height: 18 + lines.length * PARTY_LINE_HEIGHT,
        };
      });

      const rowHeight = Math.max(...cardData.map((card) => card.height));
      this.ensureSpace(state, rowHeight + 6);

      const topY = state.cursorY;
      const bottomY = topY - rowHeight;

      cardData.forEach((card, cardIndex) => {
        const cardX = PDF_LAYOUT.marginX + cardIndex * (cardWidth + cardGap);

        state.page.drawRectangle({
          x: cardX,
          y: bottomY,
          width: cardWidth,
          height: rowHeight,
          borderColor: PDF_COLORS.border,
          borderWidth: 1,
          color: PDF_COLORS.rowAlt,
        });

        state.page.drawText(card.party.role.toUpperCase(), {
          x: cardX + 10,
          y: topY - 11,
          font: fonts.bold,
          size: PARTY_ROLE_SIZE,
          color: PDF_COLORS.textMuted,
        });

        let y = topY - 20;
        for (const line of card.lines) {
          state.page.drawText(line, {
            x: cardX + 10,
            y,
            font: fonts.regular,
            size: PARTY_TEXT_SIZE,
            color: PDF_COLORS.text,
          });
          y -= PARTY_LINE_HEIGHT;
        }
      });

      state.cursorY = bottomY - 2;
    }
  }

  private drawParagraphs(
    state: RenderState,
    fonts: FontSet,
    paragraphs: string[],
  ) {
    const finalSectionIndex = paragraphs.findIndex(
      (paragraph) => paragraph.trim().toUpperCase() === "DISPOSIÇÕES FINAIS:",
    );

    const regularParagraphs =
      finalSectionIndex >= 0
        ? paragraphs.slice(0, finalSectionIndex)
        : paragraphs;

    regularParagraphs.forEach((paragraph, index) => {
      if (index === 0) {
        this.ensureSpace(state, BODY_FIRST_PARAGRAPH_GAP);
        state.cursorY -= BODY_FIRST_PARAGRAPH_GAP;
      }

      const isClauseTitle = /^CL[ÁA]USULA\s+/i.test(paragraph.trim());
      const paragraphFont = isClauseTitle ? fonts.bold : fonts.regular;
      const paragraphSize = isClauseTitle ? CLAUSE_TITLE_SIZE : BODY_TEXT_SIZE;
      const paragraphLineHeight = isClauseTitle
        ? CLAUSE_TITLE_LINE_HEIGHT
        : BODY_LINE_HEIGHT;

      const lines = wrapText(
        paragraph,
        PDF_LAYOUT.contentWidth - BODY_INSET_X * 2,
        paragraphFont,
        paragraphSize,
      );
      const requiredHeight = lines.length * paragraphLineHeight + PARAGRAPH_GAP;
      this.ensureSpace(state, requiredHeight);

      for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
        const line = lines[lineIndex];
        const isLastLine = lineIndex === lines.length - 1;

        if (isClauseTitle || isLastLine) {
          state.page.drawText(line, {
            x: PDF_LAYOUT.marginX + BODY_INSET_X,
            y: state.cursorY,
            font: paragraphFont,
            size: paragraphSize,
            color: PDF_COLORS.text,
          });
        } else {
          this.drawJustifiedLine(
            state.page,
            line,
            PDF_LAYOUT.marginX + BODY_INSET_X,
            state.cursorY,
            paragraphFont,
            paragraphSize,
            PDF_LAYOUT.contentWidth - BODY_INSET_X * 2,
            PDF_COLORS.text,
          );
        }

        state.cursorY -= paragraphLineHeight;
      }

      state.cursorY -= PARAGRAPH_GAP;

      return undefined;
    });

    if (finalSectionIndex >= 0) {
      this.drawFinalSection(
        state,
        fonts,
        paragraphs.slice(finalSectionIndex + 1),
      );
    }
  }

  private drawJustifiedLine(
    page: PDFPage,
    line: string,
    x: number,
    y: number,
    font: PDFFont,
    size: number,
    availableWidth: number,
    color: Color,
  ): void {
    const words = line.trim().split(/\s+/);
    if (words.length <= 1) {
      page.drawText(line, { x, y, font, size, color });
      return;
    }

    const wordWidths = words.map((w) => font.widthOfTextAtSize(w, size));
    const totalWordWidth = wordWidths.reduce((acc, w) => acc + w, 0);
    const totalGap = availableWidth - totalWordWidth;
    const gapWidth = totalGap / (words.length - 1);

    let curX = x;
    for (let i = 0; i < words.length; i += 1) {
      page.drawText(words[i], { x: curX, y, font, size, color });
      if (i < words.length - 1) {
        curX += wordWidths[i] + gapWidth;
      }
    }
  }

  private drawClauses(state: RenderState, fonts: FontSet, clauses: string[]) {
    for (let index = 0; index < clauses.length; index += 1) {
      const prefix = `${index + 1}. `;
      const lines = wrapText(
        `${prefix}${clauses[index]}`,
        PDF_LAYOUT.contentWidth - 6,
        fonts.regular,
        BODY_TEXT_SIZE,
      );
      const requiredHeight = lines.length * BODY_LINE_HEIGHT + PARAGRAPH_GAP;
      this.ensureSpace(state, requiredHeight);

      for (const line of lines) {
        state.page.drawText(line, {
          x: PDF_LAYOUT.marginX,
          y: state.cursorY,
          font: fonts.regular,
          size: BODY_TEXT_SIZE,
          color: PDF_COLORS.text,
        });
        state.cursorY -= BODY_LINE_HEIGHT;
      }

      state.cursorY -= PARAGRAPH_GAP;
    }
  }

  private drawFinalSection(
    state: RenderState,
    fonts: FontSet,
    paragraphs: string[],
  ) {
    state.cursorY -= FINAL_SECTION_TOP_GAP;
    this.drawSectionTitle(state, fonts, "Disposições Finais");

    const wrappedParagraphs = paragraphs.map((paragraph) =>
      wrapText(
        paragraph,
        PDF_LAYOUT.contentWidth - FINAL_SECTION_PADDING_X * 2,
        fonts.regular,
        BODY_TEXT_SIZE,
      ),
    );

    const textHeight = wrappedParagraphs.reduce(
      (total, lines) => total + lines.length * BODY_LINE_HEIGHT,
      0,
    );
    const interParagraphSpacing =
      Math.max(wrappedParagraphs.length - 1, 0) * FINAL_SECTION_LINE_GAP;
    const boxHeight =
      textHeight + interParagraphSpacing + FINAL_SECTION_PADDING_Y * 2;

    this.ensureSpace(state, boxHeight + 4);

    const boxX = PDF_LAYOUT.marginX + BODY_INSET_X;
    const boxWidth = PDF_LAYOUT.contentWidth - BODY_INSET_X * 2;
    const boxY = state.cursorY - boxHeight + 2;

    state.page.drawRectangle({
      x: boxX,
      y: boxY,
      width: boxWidth,
      height: boxHeight,
      borderColor: PDF_COLORS.gold,
      borderWidth: 1,
      color: PDF_COLORS.rowAlt,
      opacity: 0.95,
    });

    let currentY = state.cursorY - FINAL_SECTION_PADDING_Y;
    wrappedParagraphs.forEach((lines, paragraphIndex) => {
      const font =
        paragraphIndex === wrappedParagraphs.length - 1
          ? fonts.bold
          : fonts.regular;

      for (const line of lines) {
        state.page.drawText(line, {
          x: boxX + FINAL_SECTION_PADDING_X,
          y: currentY,
          font,
          size: BODY_TEXT_SIZE,
          color: PDF_COLORS.text,
        });
        currentY -= BODY_LINE_HEIGHT;
      }

      if (paragraphIndex < wrappedParagraphs.length - 1) {
        currentY -= FINAL_SECTION_LINE_GAP;
      }
    });

    state.cursorY = boxY - 4;
  }

  private drawFooter(
    page: PDFPage,
    fonts: FontSet,
    payload: ContractPdfPayload,
    pageCounter: string,
  ) {
    const startY = 62;

    page.drawLine({
      start: { x: PDF_LAYOUT.marginX, y: startY + 28 },
      end: { x: PDF_LAYOUT.pageWidth - PDF_LAYOUT.marginX, y: startY + 28 },
      thickness: 1,
      color: PDF_COLORS.border,
    });

    page.drawText(payload.footer.cityAndIssueDate, {
      x: PDF_LAYOUT.marginX,
      y: startY + 8,
      font: fonts.bold,
      size: 8,
      color: PDF_COLORS.text,
    });

    const legalLines = wrapText(
      payload.footer.legalNotice,
      PDF_LAYOUT.contentWidth,
      fonts.regular,
      7,
    );

    let y = startY - 4;
    for (const line of legalLines) {
      page.drawText(line, {
        x: PDF_LAYOUT.marginX,
        y,
        font: fonts.regular,
        size: 7,
        color: PDF_COLORS.textMuted,
      });
      y -= 8;
    }

    page.drawText(
      `Ref. ${payload.referenceCode.slice(0, 12)}  Pag. ${pageCounter}`,
      {
        x: PDF_LAYOUT.pageWidth - 170,
        y: 24,
        font: fonts.regular,
        size: PDF_FONT_SIZES.micro,
        color: PDF_COLORS.textLight,
      },
    );
  }
}
