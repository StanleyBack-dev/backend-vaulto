import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class GetCategoryComparisonInputDto {
  @Field(() => Date, { nullable: true })
  referenceDate?: Date;

  @Field(() => Date, { nullable: true })
  comparisonDate?: Date;
}
