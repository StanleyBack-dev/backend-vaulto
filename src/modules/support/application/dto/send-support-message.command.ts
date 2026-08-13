import type { SupportCategory } from "@/modules/support/domain/enums/support-category.enum";

export interface SendSupportMessageCommand {
  category: SupportCategory;
  message: string;
}
