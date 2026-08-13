import { registerEnumType } from "@nestjs/graphql";
import { SupportCategory } from "@/modules/support/domain/enums/support-category.enum";

registerEnumType(SupportCategory, {
  name: "SupportCategory",
});
