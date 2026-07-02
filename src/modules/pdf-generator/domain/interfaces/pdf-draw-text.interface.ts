export interface PdfDrawText {
  text: string;
  x: number;
  y: number;
  pageIndex?: number;
  fontSize?: number;
  /** Draw a white rectangle before the text to erase underlying content */
  clearBefore?: boolean;
  /** Width of the clear rectangle (required when clearBefore is true) */
  clearWidth?: number;
  /** Height of the clear rectangle (required when clearBefore is true) */
  clearHeight?: number;
}
