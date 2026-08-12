/** Safety cap on rows fetched per export so a pathological data set can't produce an unbounded file. */
export const EXPORT_MAX_ROWS = 2000;

export const EXPORT_MIME_TYPE_BY_FORMAT = {
  PDF: "application/pdf",
  XLSX: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
} as const;

export const EXPORT_FILE_EXTENSION_BY_FORMAT = {
  PDF: "pdf",
  XLSX: "xlsx",
} as const;
