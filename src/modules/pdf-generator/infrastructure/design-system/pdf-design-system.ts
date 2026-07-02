import { rgb } from "pdf-lib";

/** Brand and UI colors - aligned with frontend theme */
export const PDF_COLORS = {
  // Primary brand colors
  gold: rgb(0.79, 0.64, 0.15), // #C9A227
  goldDark: rgb(0.66, 0.51, 0.1), // #a8811a
  // Text and semantic colors
  text: rgb(0.17, 0.09, 0.06), // #2C1810 (brown-800)
  textMuted: rgb(0.48, 0.27, 0.19), // #7a4430 (brown-500)
  textLight: rgb(0.77, 0.27, 0.19), // #c4a882 (brown-300)
  // Backgrounds and borders
  border: rgb(0.91, 0.84, 0.79), // #e8d5c9 (brown-100)
  rowAlt: rgb(0.98, 0.96, 0.94), // #faf6f2 (near-white with warmth)
  bgLight: rgb(0.96, 0.93, 0.91), // #f5ede8 (brown-50)
  white: rgb(1, 1, 1),
} as const;

/** Page layout constants (A4 points) */
export const PDF_LAYOUT = {
  pageWidth: 595.28,
  pageHeight: 841.89,
  marginX: 40,
  topMargin: 36,
  bottomMargin: 110,
  get contentWidth() {
    return this.pageWidth - this.marginX * 2;
  },
} as const;

/** Font sizes */
export const PDF_FONT_SIZES = {
  heading: 20,
  subheading: 10,
  sectionTitle: 12,
  body: 10,
  small: 8,
  micro: 7,
} as const;
