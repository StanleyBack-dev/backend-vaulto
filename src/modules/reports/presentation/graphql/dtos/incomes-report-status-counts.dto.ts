import { Field, Int, ObjectType } from "@nestjs/graphql";
import type { IncomesReportStatusCounts } from "@/modules/reports/application/ports/report-repository.port";

@ObjectType()
export class IncomesReportStatusCountsDto {
  static fromView(
    view: IncomesReportStatusCounts,
  ): IncomesReportStatusCountsDto {
    const dto = new IncomesReportStatusCountsDto();
    dto.pending = view.pending;
    dto.overdue = view.overdue;
    dto.partiallyReceived = view.partiallyReceived;
    dto.received = view.received;
    return dto;
  }

  @Field(() => Int)
  pending!: number;

  @Field(() => Int)
  overdue!: number;

  @Field(() => Int)
  partiallyReceived!: number;

  @Field(() => Int)
  received!: number;
}
