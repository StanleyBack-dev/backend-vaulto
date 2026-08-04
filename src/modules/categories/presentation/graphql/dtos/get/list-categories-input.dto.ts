import { Field, InputType } from "@nestjs/graphql";
import { PaginationInputDto } from "@/common/responses/dtos/pagination-input.dto";

@InputType()
export class ListCategoriesInputDto extends PaginationInputDto {
  @Field({ nullable: true })
  status?: boolean;
}
