import { Field, Float, Int, ObjectType } from "@nestjs/graphql";
import type { IncomesReportView } from "@/modules/reports/application/ports/report-repository.port";
import { IncomesReportStatusCountsDto } from "@/modules/reports/presentation/graphql/dtos/incomes-report-status-counts.dto";

@ObjectType()
export class IncomesReportResponseDto {
  static fromView(view: IncomesReportView): IncomesReportResponseDto {
    const dto = new IncomesReportResponseDto();
    dto.totalAmountDue = view.totalAmountDue;
    dto.totalAmountReceived = view.totalAmountReceived;
    dto.totalOutstanding = view.totalOutstanding;
    dto.totalCount = view.totalCount;
    dto.countByStatus = IncomesReportStatusCountsDto.fromView(
      view.countByStatus,
    );
    return dto;
  }

  @Field(() => Float)
  totalAmountDue!: number;

  @Field(() => Float)
  totalAmountReceived!: number;

  @Field(() => Float)
  totalOutstanding!: number;

  @Field(() => Int)
  totalCount!: number;

  @Field(() => IncomesReportStatusCountsDto)
  countByStatus!: IncomesReportStatusCountsDto;
}
