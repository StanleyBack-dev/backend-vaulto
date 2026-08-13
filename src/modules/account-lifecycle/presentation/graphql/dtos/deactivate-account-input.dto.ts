import { Field, InputType } from "@nestjs/graphql";
import { AccountDeactivationReason } from "@/modules/account-lifecycle/domain/enums/account-deactivation-reason.enum";

@InputType()
export class DeactivateAccountInputDto {
  @Field(() => [AccountDeactivationReason])
  reasons!: AccountDeactivationReason[];

  @Field({ nullable: true })
  otherReason?: string;
}
