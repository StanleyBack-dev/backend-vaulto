import { Field, InputType } from "@nestjs/graphql";
import { PaginationInputDto } from "@/common/responses/dtos/pagination-input.dto";
import { CategoryType } from "@/modules/categories/domain/enums/category-type.enum";

@InputType()
export class ListCategoriesInputDto extends PaginationInputDto {
  @Field({ nullable: true })
  status?: boolean;

  @Field(() => CategoryType, { nullable: true })
  type?: CategoryType;
}
