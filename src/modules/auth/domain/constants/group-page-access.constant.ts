import { UserGroup } from "@/modules/users/domain/enums/user-group.enum";
import { PageAccessKey } from "@/modules/auth/domain/enums/page-access-key.enum";

export const GROUP_DEFAULT_PAGE_ACCESS: Record<UserGroup, PageAccessKey[]> = {
  [UserGroup.USER]: [PageAccessKey.DASHBOARD],
  [UserGroup.ADMIN]: [
    PageAccessKey.DASHBOARD,
  ],
  [UserGroup.ADMIN_MASTER]: [
    PageAccessKey.DASHBOARD,
  ],
};


