import { InputType } from "@nestjs/graphql";
import { PaginationInputDto } from "@/common/responses/dtos/pagination-input.dto";

@InputType()
export class GetUsersInputDto extends PaginationInputDto {}
