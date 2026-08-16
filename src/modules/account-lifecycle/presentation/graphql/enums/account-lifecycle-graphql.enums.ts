import { registerEnumType } from "@nestjs/graphql";
import { AccountDeactivationReason } from "@/modules/account-lifecycle/domain/enums/account-deactivation-reason.enum";
import { AccountDeletionReason } from "@/modules/account-lifecycle/domain/enums/account-deletion-reason.enum";

registerEnumType(AccountDeactivationReason, {
  name: "AccountDeactivationReason",
});

registerEnumType(AccountDeletionReason, {
  name: "AccountDeletionReason",
});
