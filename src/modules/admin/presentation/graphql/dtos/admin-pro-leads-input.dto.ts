import { Field, InputType } from "@nestjs/graphql";
import { IsEnum, IsOptional } from "class-validator";
import { PaginationInputDto } from "@/common/responses/dtos/pagination-input.dto";
import { ProLeadEvent } from "@/modules/billing/domain/enums/pro-lead-event.enum";

@InputType()
export class AdminProLeadsInputDto extends PaginationInputDto {
  @Field(() => ProLeadEvent, { nullable: true })
  @IsOptional()
  @IsEnum(ProLeadEvent)
  eventType?: ProLeadEvent;
}
