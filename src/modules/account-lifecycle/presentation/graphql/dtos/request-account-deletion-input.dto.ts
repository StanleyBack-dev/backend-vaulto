import { Field, InputType } from "@nestjs/graphql";
import { AccountDeletionReason } from "@/modules/account-lifecycle/domain/enums/account-deletion-reason.enum";

@InputType()
export class RequestAccountDeletionInputDto {
  @Field(() => [AccountDeletionReason])
  reasons!: AccountDeletionReason[];

  @Field({ nullable: true })
  otherReason?: string;
}
