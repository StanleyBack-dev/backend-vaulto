import { Field, Int, ObjectType } from "@nestjs/graphql";
import type { DebtsReportStatusCounts } from "@/modules/reports/application/ports/report-repository.port";

@ObjectType()
export class DebtsReportStatusCountsDto {
  static fromView(view: DebtsReportStatusCounts): DebtsReportStatusCountsDto {
    const dto = new DebtsReportStatusCountsDto();
    dto.open = view.open;
    dto.overdue = view.overdue;
    dto.partiallyPaid = view.partiallyPaid;
    dto.paid = view.paid;
    return dto;
  }

  @Field(() => Int)
  open!: number;

  @Field(() => Int)
  overdue!: number;

  @Field(() => Int)
  partiallyPaid!: number;

  @Field(() => Int)
  paid!: number;
}
