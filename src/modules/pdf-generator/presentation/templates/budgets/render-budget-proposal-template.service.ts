import { Injectable } from "@nestjs/common";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  PDFDocument,
  PDFFont,
  PDFImage,
  PDFPage,
  StandardFonts,
} from "pdf-lib";
import { formatCurrencyBRL, wrapText } from "@/utils/pdf";
import {
  PDF_COLORS,
  PDF_FONT_SIZES,
  PDF_LAYOUT,
} from "../../../infrastructure/design-system/pdf-design-system";
import { PdfTemplateKey } from "../../../domain/enums/pdf-template-key.enum";
import { PdfTemplateRenderer } from "../../../application/interfaces/pdf-template-renderer.interface";
import {
  BudgetProposalPdfPayload,
  BudgetProposalPdfPayloadDetail,
  BudgetProposalPdfPayloadItem,
} from "./interfaces/budget-proposal-pdf-payload.interface";

const HEADER_HEIGHT = 68;
const LOGO_BOX_WIDTH = 80;
const LOGO_BOX_HEIGHT = 48;
const META_BOX_WIDTH = 150;
const TABLE_HEADER_HEIGHT = 24;
const SECTION_SPACING = 12;
const ROW_SPACING = 8;
const DETAIL_GAP = 10;
const HEADER_DIVIDER_Y = PDF_LAYOUT.pageHeight - 132;
const CONTENT_START_Y = HEADER_DIVIDER_Y - 18;
const FOOTER_RESERVED_HEIGHT = 124;
const TABLE_DESCRIPTION_WIDTH = 304;
const TABLE_QTY_WIDTH = 36;
const TABLE_UNIT_WIDTH = 84;
const TABLE_TOTAL_WIDTH = 82;
const LOGO_IMAGE_PATH = resolve(process.cwd(), "src/assets/images/logo.png");

interface FontSet {
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
}

interface RenderState {
  document: PDFDocument;
  page: PDFPage;
  pages: PDFPage[];
  cursorY: number;
}

interface HeaderAssets {
  logo?: PDFImage;
}

@Injectable()
export class RenderBudgetProposalTemplateService implements PdfTemplateRenderer<BudgetProposalPdfPayload> {
  readonly templateKey = PdfTemplateKey.BUDGETS;
  private _lastPayloadTotals: string = "";

  async render(payload: BudgetProposalPdfPayload): Promise<Buffer> {
    const document = await PDFDocument.create();
    const fonts = await this.loadFonts(document);
    const headerAssets = await this.loadHeaderAssets(document);
    const state = this.createState(document);

    this.drawHeader(state.page, fonts, payload, headerAssets);
    state.cursorY = CONTENT_START_Y;

    this.drawSectionTitle(state, fonts, "Apresentação");
    this.drawParagraphs(state, fonts, payload.introductionParagraphs);

    this.drawSectionTitle(state, fonts, "Resumo da Proposta");
    this.drawDetailCards(state, fonts, payload.eventDetails);

    this.drawSectionTitle(state, fonts, payload.itemsSectionTitle);
    // store totals value for the items table totals row
    this._lastPayloadTotals = payload.totals?.total || "";
    this.drawItemsTable(state, fonts, payload.items, payload.itemsSectionTitle);

    if (payload.notes.length > 0) {
      this.drawSectionTitle(state, fonts, "Observações");
      this.drawBulletNotes(state, fonts, payload.notes);
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
    const [regular, bold, italic] = await Promise.all([
      document.embedFont(StandardFonts.Helvetica),
      document.embedFont(StandardFonts.HelveticaBold),
      document.embedFont(StandardFonts.HelveticaOblique),
    ]);

    return { regular, bold, italic };
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
    payload: BudgetProposalPdfPayload,
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

    page.drawText(payload.documentTitle.toUpperCase(), {
      x: textX,
      y: PDF_LAYOUT.pageHeight - 94,
      font: fonts.bold,
      size: 14,
      color: PDF_COLORS.goldDark,
    });

    page.drawText(payload.documentSubtitle, {
      x: textX,
      y: PDF_LAYOUT.pageHeight - 108,
      font: fonts.regular,
      size: 9,
      color: PDF_COLORS.textMuted,
    });

    const metaBoxX = PDF_LAYOUT.pageWidth - PDF_LAYOUT.marginX - META_BOX_WIDTH;
    const metaBoxY = PDF_LAYOUT.pageHeight - 94;
    page.drawRectangle({
      x: metaBoxX,
      y: metaBoxY,
      width: META_BOX_WIDTH,
      height: 60,
      borderColor: PDF_COLORS.border,
      borderWidth: 1,
      color: PDF_COLORS.white,
    });

    let metaY = metaBoxY + 42;
    for (const detail of payload.metadata) {
      page.drawText(`${detail.label}:`, {
        x: metaBoxX + 12,
        y: metaY,
        font: fonts.bold,
        size: PDF_FONT_SIZES.small,
        color: PDF_COLORS.text,
      });

      page.drawText(detail.value, {
        x: metaBoxX + 72,
        y: metaY,
        font: fonts.regular,
        size: PDF_FONT_SIZES.small,
        color: PDF_COLORS.textMuted,
      });

      metaY -= 12;
      if (metaY < metaBoxY + 6) {
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

  private drawSectionTitle(state: RenderState, fonts: FontSet, title: string) {
    this.ensureSpace(state, 22);
    state.page.drawText(title.toUpperCase(), {
      x: PDF_LAYOUT.marginX,
      y: state.cursorY,
      font: fonts.bold,
      size: 11,
      color: PDF_COLORS.text,
    });

    const specialTitles = ["Apresentação", "Resumo da Proposta"];
    const baseWidth = 125;
    const underlineWidth = specialTitles.includes(title)
      ? Math.round(baseWidth * 1.3)
      : baseWidth;

    state.page.drawRectangle({
      x: PDF_LAYOUT.marginX,
      y: state.cursorY - 5,
      width: underlineWidth,
      height: 2,
      color: PDF_COLORS.gold,
    });

    state.cursorY -= 16;
  }

  private drawParagraphs(
    state: RenderState,
    fonts: FontSet,
    paragraphs: string[],
  ) {
    for (const paragraph of paragraphs) {
      const lines = wrapText(
        paragraph,
        PDF_LAYOUT.contentWidth,
        fonts.regular,
        PDF_FONT_SIZES.body,
      );
      const requiredHeight = lines.length * 12 + 6;
      this.ensureSpace(state, requiredHeight);

      for (const line of lines) {
        state.page.drawText(line, {
          x: PDF_LAYOUT.marginX,
          y: state.cursorY,
          font: fonts.regular,
          size: PDF_FONT_SIZES.body,
          color: PDF_COLORS.text,
        });
        state.cursorY -= 12;
      }

      state.cursorY -= 6;
    }
  }

  private drawDetailCards(
    state: RenderState,
    fonts: FontSet,
    eventDetails: BudgetProposalPdfPayloadDetail[],
  ) {
    const details = [...eventDetails];
    const cardWidth = (PDF_LAYOUT.contentWidth - DETAIL_GAP) / 2;

    for (let index = 0; index < details.length; index += 2) {
      const left = details[index];
      const right = details[index + 1];
      const leftHeight = this.measureDetailCard(left, fonts, cardWidth);
      const rightHeight = right
        ? this.measureDetailCard(right, fonts, cardWidth)
        : leftHeight;
      const rowHeight = Math.max(leftHeight, rightHeight);

      this.ensureSpace(state, rowHeight + ROW_SPACING);

      this.drawDetailCard(
        state.page,
        fonts,
        left,
        PDF_LAYOUT.marginX,
        state.cursorY,
        cardWidth,
        rowHeight,
      );

      if (right) {
        this.drawDetailCard(
          state.page,
          fonts,
          right,
          PDF_LAYOUT.marginX + cardWidth + DETAIL_GAP,
          state.cursorY,
          cardWidth,
          rowHeight,
        );
      }

      state.cursorY -= rowHeight + ROW_SPACING;
    }

    state.cursorY -= 8;
  }

  private measureDetailCard(
    detail: BudgetProposalPdfPayloadDetail,
    fonts: FontSet,
    width: number,
  ): number {
    const valueLines = wrapText(
      detail.value,
      width - 24,
      fonts.regular,
      PDF_FONT_SIZES.body,
    );

    return 26 + valueLines.length * 11;
  }

  private drawDetailCard(
    page: PDFPage,
    fonts: FontSet,
    detail: BudgetProposalPdfPayloadDetail,
    x: number,
    topY: number,
    width: number,
    height: number,
  ) {
    const bottomY = topY - height;
    const valueLines = wrapText(
      detail.value,
      width - 24,
      fonts.regular,
      PDF_FONT_SIZES.body,
    );

    page.drawRectangle({
      x,
      y: bottomY,
      width,
      height,
      borderColor: PDF_COLORS.border,
      borderWidth: 1,
      color: PDF_COLORS.rowAlt,
    });

    page.drawText(detail.label.toUpperCase(), {
      x: x + 12,
      y: topY - 16,
      font: fonts.bold,
      size: PDF_FONT_SIZES.small,
      color: PDF_COLORS.textMuted,
    });

    let lineY = topY - 29;
    for (const line of valueLines) {
      page.drawText(line, {
        x: x + 12,
        y: lineY,
        font: fonts.regular,
        size: PDF_FONT_SIZES.body,
        color: PDF_COLORS.text,
      });
      lineY -= 11;
    }
  }

  private drawItemsTable(
    state: RenderState,
    fonts: FontSet,
    items: BudgetProposalPdfPayloadItem[],
    sectionTitle: string,
  ) {
    this.drawTableHeader(state.page, fonts, state.cursorY);
    state.cursorY -= TABLE_HEADER_HEIGHT;

    items.forEach((item, index) => {
      const rowHeight = this.measureItemRow(item, fonts);

      if (state.cursorY - rowHeight < FOOTER_RESERVED_HEIGHT) {
        this.addPage(state);
        this.drawSectionTitle(state, fonts, sectionTitle);
        this.drawTableHeader(state.page, fonts, state.cursorY);
        state.cursorY -= TABLE_HEADER_HEIGHT;
      }

      this.drawItemRow(
        state.page,
        fonts,
        item,
        index,
        state.cursorY,
        rowHeight,
      );
      state.cursorY -= rowHeight;
    });

    // add an extra row for the total value under the 'Total' column
    const totalRowHeight = 22;
    if (state.cursorY - totalRowHeight < FOOTER_RESERVED_HEIGHT) {
      this.addPage(state);
      this.drawSectionTitle(state, fonts, sectionTitle);
      this.drawTableHeader(state.page, fonts, state.cursorY);
      state.cursorY -= TABLE_HEADER_HEIGHT;
    }

    const totalTopY = state.cursorY;
    const totalBottomY = totalTopY - totalRowHeight;
    const x = PDF_LAYOUT.marginX;
    const totalCenterX =
      x +
      TABLE_DESCRIPTION_WIDTH +
      TABLE_QTY_WIDTH +
      TABLE_UNIT_WIDTH +
      TABLE_TOTAL_WIDTH / 2;

    state.page.drawRectangle({
      x,
      y: totalBottomY,
      width: PDF_LAYOUT.contentWidth,
      height: totalRowHeight,
      color: PDF_COLORS.rowAlt,
      borderColor: PDF_COLORS.border,
      borderWidth: 0.6,
    });

    // label on the left (bold)
    state.page.drawText("Total", {
      x: x + 10,
      y: totalTopY - 14,
      font: fonts.bold,
      size: PDF_FONT_SIZES.body,
      color: PDF_COLORS.text,
    });

    // total value centered in the total column
    this.drawCenteredText(
      state.page,
      fonts.bold,
      this._lastPayloadTotals || "",
      totalCenterX,
      totalTopY - 14,
      PDF_FONT_SIZES.body,
      PDF_COLORS.text,
    );

    state.cursorY = totalBottomY - 8;
  }

  private drawTableHeader(page: PDFPage, fonts: FontSet, topY: number) {
    const x = PDF_LAYOUT.marginX;
    const bottomY = topY - TABLE_HEADER_HEIGHT;
    const descriptionX = x + 10;
    const qtyCenterX = x + TABLE_DESCRIPTION_WIDTH + TABLE_QTY_WIDTH / 2;
    const unitCenterX =
      x + TABLE_DESCRIPTION_WIDTH + TABLE_QTY_WIDTH + TABLE_UNIT_WIDTH / 2;
    const totalCenterX =
      x +
      TABLE_DESCRIPTION_WIDTH +
      TABLE_QTY_WIDTH +
      TABLE_UNIT_WIDTH +
      TABLE_TOTAL_WIDTH / 2;

    page.drawRectangle({
      x,
      y: bottomY,
      width: PDF_LAYOUT.contentWidth,
      height: TABLE_HEADER_HEIGHT,
      color: PDF_COLORS.bgLight,
      borderColor: PDF_COLORS.border,
      borderWidth: 1,
    });

    page.drawText("Descrição", {
      x: descriptionX,
      y: topY - 16,
      font: fonts.bold,
      size: PDF_FONT_SIZES.small,
      color: PDF_COLORS.textMuted,
    });

    this.drawCenteredText(
      page,
      fonts.bold,
      "Qtd",
      qtyCenterX,
      topY - 16,
      PDF_FONT_SIZES.small,
      PDF_COLORS.textMuted,
    );
    this.drawCenteredText(
      page,
      fonts.bold,
      "Unitário",
      unitCenterX,
      topY - 16,
      PDF_FONT_SIZES.small,
      PDF_COLORS.textMuted,
    );
    this.drawCenteredText(
      page,
      fonts.bold,
      "Total",
      totalCenterX,
      topY - 16,
      PDF_FONT_SIZES.small,
      PDF_COLORS.textMuted,
    );
  }

  private measureItemRow(item: BudgetProposalPdfPayloadItem, fonts: FontSet) {
    const descriptionLines = wrapText(
      item.description,
      TABLE_DESCRIPTION_WIDTH,
      fonts.regular,
      PDF_FONT_SIZES.body,
    );

    return 14 + descriptionLines.length * 11 + 6;
  }

  private drawItemRow(
    page: PDFPage,
    fonts: FontSet,
    item: BudgetProposalPdfPayloadItem,
    index: number,
    topY: number,
    height: number,
  ) {
    const x = PDF_LAYOUT.marginX;
    const bottomY = topY - height;
    const descriptionLines = wrapText(
      item.description,
      TABLE_DESCRIPTION_WIDTH,
      fonts.regular,
      PDF_FONT_SIZES.body,
    );
    const valueY = bottomY + height / 2 - PDF_FONT_SIZES.body / 2 + 1;
    const qtyCenterX = x + TABLE_DESCRIPTION_WIDTH + TABLE_QTY_WIDTH / 2;
    const unitCenterX =
      x + TABLE_DESCRIPTION_WIDTH + TABLE_QTY_WIDTH + TABLE_UNIT_WIDTH / 2;
    const totalCenterX =
      x +
      TABLE_DESCRIPTION_WIDTH +
      TABLE_QTY_WIDTH +
      TABLE_UNIT_WIDTH +
      TABLE_TOTAL_WIDTH / 2;

    page.drawRectangle({
      x,
      y: bottomY,
      width: PDF_LAYOUT.contentWidth,
      height,
      color: index % 2 === 0 ? PDF_COLORS.white : PDF_COLORS.rowAlt,
      borderColor: PDF_COLORS.border,
      borderWidth: 0.6,
    });

    let lineY = topY - 13;
    for (const line of descriptionLines) {
      page.drawText(line, {
        x: x + 10,
        y: lineY,
        font: fonts.regular,
        size: PDF_FONT_SIZES.body,
        color: PDF_COLORS.text,
      });
      lineY -= 11;
    }

    this.drawCenteredText(
      page,
      fonts.bold,
      item.quantity,
      qtyCenterX,
      valueY,
      PDF_FONT_SIZES.body,
      PDF_COLORS.text,
    );
    this.drawCenteredText(
      page,
      fonts.regular,
      item.unitPrice,
      unitCenterX,
      valueY,
      PDF_FONT_SIZES.body,
      PDF_COLORS.text,
    );
    this.drawCenteredText(
      page,
      fonts.bold,
      item.totalPrice,
      totalCenterX,
      valueY,
      PDF_FONT_SIZES.body,
      PDF_COLORS.text,
    );
  }

  private drawBulletNotes(state: RenderState, fonts: FontSet, notes: string[]) {
    for (const note of notes) {
      const lines = wrapText(
        note,
        PDF_LAYOUT.contentWidth - 18,
        fonts.regular,
        PDF_FONT_SIZES.body,
      );
      const requiredHeight = lines.length * 12 + 4;
      this.ensureSpace(state, requiredHeight);

      state.page.drawCircle({
        x: PDF_LAYOUT.marginX + 4,
        y: state.cursorY + 4,
        size: 2.2,
        color: PDF_COLORS.goldDark,
      });

      for (const line of lines) {
        state.page.drawText(line, {
          x: PDF_LAYOUT.marginX + 14,
          y: state.cursorY,
          font: fonts.regular,
          size: PDF_FONT_SIZES.body,
          color: PDF_COLORS.text,
        });
        state.cursorY -= 12;
      }

      state.cursorY -= 4;
    }
  }

  private drawTotalsCard(
    state: RenderState,
    fonts: FontSet,
    payload: BudgetProposalPdfPayload,
  ) {
    const width = 194;
    const height = payload.notes.length > 0 ? 62 : 56;
    this.ensureSpace(state, height + 8);

    const x = PDF_LAYOUT.pageWidth - PDF_LAYOUT.marginX - width;
    const topY = state.cursorY;
    const bottomY = topY - height;

    state.page.drawRectangle({
      x,
      y: bottomY,
      width,
      height,
      borderColor: PDF_COLORS.border,
      borderWidth: 1,
      color: PDF_COLORS.bgLight,
    });

    state.page.drawText("Subtotal", {
      x: x + 14,
      y: topY - 18,
      font: fonts.regular,
      size: 9,
      color: PDF_COLORS.text,
    });

    this.drawRightAlignedText(
      state.page,
      fonts.regular,
      payload.totals.subtotal,
      x + width - 14,
      topY - 18,
      9,
    );

    state.page.drawLine({
      start: { x: x + 14, y: topY - 25 },
      end: { x: x + width - 14, y: topY - 25 },
      thickness: 1,
      color: PDF_COLORS.border,
    });

    state.page.drawText("Total", {
      x: x + 14,
      y: topY - 39,
      font: fonts.bold,
      size: 11,
      color: PDF_COLORS.text,
    });

    this.drawRightAlignedText(
      state.page,
      fonts.bold,
      payload.totals.total,
      x + width - 14,
      topY - 39,
      11,
    );

    state.cursorY = bottomY - SECTION_SPACING;
  }

  private drawFooter(
    page: PDFPage,
    fonts: FontSet,
    payload: BudgetProposalPdfPayload,
    pageCounter: string,
  ) {
    const startY = 84;

    page.drawLine({
      start: { x: PDF_LAYOUT.marginX, y: startY + 28 },
      end: { x: PDF_LAYOUT.pageWidth - PDF_LAYOUT.marginX, y: startY + 28 },
      thickness: 1,
      color: PDF_COLORS.border,
    });

    page.drawText(payload.footer.cityAndIssueDate, {
      x: PDF_LAYOUT.marginX,
      y: startY + 10,
      font: fonts.bold,
      size: 9,
      color: PDF_COLORS.text,
    });

    page.drawText(payload.footer.validity, {
      x: PDF_LAYOUT.marginX,
      y: startY - 4,
      font: fonts.regular,
      size: PDF_FONT_SIZES.small,
      color: PDF_COLORS.textMuted,
    });

    const reservationLines = wrapText(
      payload.footer.reservationPolicy,
      PDF_LAYOUT.contentWidth,
      fonts.regular,
      PDF_FONT_SIZES.small,
    );
    const convenienceLines = wrapText(
      payload.footer.convenienceMessage,
      PDF_LAYOUT.contentWidth,
      fonts.regular,
      PDF_FONT_SIZES.small,
    );

    let lineY = startY - 17;
    for (const line of reservationLines) {
      page.drawText(line, {
        x: PDF_LAYOUT.marginX,
        y: lineY,
        font: fonts.regular,
        size: PDF_FONT_SIZES.small,
        color: PDF_COLORS.textMuted,
      });
      lineY -= 9;
    }

    for (const line of convenienceLines) {
      page.drawText(line, {
        x: PDF_LAYOUT.marginX,
        y: lineY,
        font: fonts.regular,
        size: PDF_FONT_SIZES.small,
        color: PDF_COLORS.textMuted,
      });
      lineY -= 9;
    }

    page.drawText(payload.footer.paymentMethods, {
      x: PDF_LAYOUT.marginX,
      y: lineY - 3,
      font: fonts.regular,
      size: PDF_FONT_SIZES.small,
      color: PDF_COLORS.textMuted,
    });

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

  private drawRightAlignedText(
    page: PDFPage,
    font: PDFFont,
    text: string,
    rightX: number,
    y: number,
    size: number = PDF_FONT_SIZES.body,
  ) {
    page.drawText(text, {
      x: rightX - font.widthOfTextAtSize(text, size),
      y,
      font,
      size,
      color: text === formatCurrencyBRL(0) ? PDF_COLORS.text : PDF_COLORS.text,
    });
  }

  private drawCenteredText(
    page: PDFPage,
    font: PDFFont,
    text: string,
    centerX: number,
    y: number,
    size: number,
    color: typeof PDF_COLORS.text,
  ) {
    page.drawText(text, {
      x: centerX - font.widthOfTextAtSize(text, size) / 2,
      y,
      font,
      size,
      color,
    });
  }
}
