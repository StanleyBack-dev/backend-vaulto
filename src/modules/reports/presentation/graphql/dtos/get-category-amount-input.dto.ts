import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class GetCategoryAmountInputDto {
  @Field(() => Date)
  dueDateFrom!: Date;

  @Field(() => Date)
  dueDateTo!: Date;
}
