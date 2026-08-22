import { MarketingEmailCategory } from "@/modules/marketing-emails/domain/enums/marketing-email-category.enum";

export const MARKETING_EMAIL_CATEGORY_LABELS: Record<
  MarketingEmailCategory,
  string
> = {
  [MarketingEmailCategory.INFLUENCER]: "Influenciador / Criador de Conteúdo",
  [MarketingEmailCategory.BUSINESS_PARTNER]: "Parceiro Comercial",
  [MarketingEmailCategory.PRESS]: "Imprensa / Mídia",
  [MarketingEmailCategory.OTHER]: "Outro",
};
