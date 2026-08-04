import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class CreateCategoryInputDto {
  @Field()
  name!: string;

  @Field({ nullable: true })
  status?: boolean;
}
