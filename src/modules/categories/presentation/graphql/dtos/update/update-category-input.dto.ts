import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class UpdateCategoryInputDto {
  @Field()
  idCategory!: string;

  @Field()
  name!: string;

  @Field()
  status!: boolean;
}
