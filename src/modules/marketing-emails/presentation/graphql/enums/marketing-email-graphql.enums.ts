import { registerEnumType } from "@nestjs/graphql";
import { MarketingEmailCategory } from "@/modules/marketing-emails/domain/enums/marketing-email-category.enum";

registerEnumType(MarketingEmailCategory, {
  name: "MarketingEmailCategory",
});
