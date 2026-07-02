import { registerEnumType } from "@nestjs/graphql";

export enum PageAccessKey {
  DASHBOARD = "DASHBOARD",
}

export const ALL_PAGE_ACCESS_KEYS: PageAccessKey[] = [
  PageAccessKey.DASHBOARD,
];

registerEnumType(PageAccessKey, {
  name: "PageAccessKey",
});
