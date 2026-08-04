import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class GetCategoryByIdInputDto {
  @Field()
  idCategory!: string;
}
