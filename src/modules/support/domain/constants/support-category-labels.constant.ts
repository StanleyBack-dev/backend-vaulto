import { SupportCategory } from "@/modules/support/domain/enums/support-category.enum";

export const SUPPORT_CATEGORY_LABELS: Record<SupportCategory, string> = {
  [SupportCategory.DOUBT]: "Dúvida",
  [SupportCategory.TECHNICAL_ISSUE]: "Problema técnico / Bug",
  [SupportCategory.SUGGESTION]: "Sugestão",
  [SupportCategory.BILLING]: "Financeiro / Cobrança",
  [SupportCategory.OTHER]: "Outro",
};
