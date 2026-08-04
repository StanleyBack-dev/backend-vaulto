import { Field, Float, Int, ObjectType } from "@nestjs/graphql";
import type { DebtsReportView } from "@/modules/reports/application/ports/report-repository.port";
import { DebtsReportStatusCountsDto } from "@/modules/reports/presentation/graphql/dtos/debts-report-status-counts.dto";

@ObjectType()
export class DebtsReportResponseDto {
  static fromView(view: DebtsReportView): DebtsReportResponseDto {
    const dto = new DebtsReportResponseDto();
    dto.totalAmountDue = view.totalAmountDue;
    dto.totalAmountPaid = view.totalAmountPaid;
    dto.totalOutstanding = view.totalOutstanding;
    dto.totalCount = view.totalCount;
    dto.countByStatus = DebtsReportStatusCountsDto.fromView(view.countByStatus);
    return dto;
  }

  @Field(() => Float)
  totalAmountDue!: number;

  @Field(() => Float)
  totalAmountPaid!: number;

  @Field(() => Float)
  totalOutstanding!: number;

  @Field(() => Int)
  totalCount!: number;

  @Field(() => DebtsReportStatusCountsDto)
  countByStatus!: DebtsReportStatusCountsDto;
}
