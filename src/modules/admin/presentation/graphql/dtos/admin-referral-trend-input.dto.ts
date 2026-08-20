import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class AdminReferralTrendInputDto {
  @Field(() => Date)
  dateFrom!: Date;

  @Field(() => Date)
  dateTo!: Date;
}
