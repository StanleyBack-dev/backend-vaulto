import { Field, Int, ObjectType } from "@nestjs/graphql";
import type { FinancialHealthScoreView } from "@/modules/reports/application/use-cases/get-financial-health-score.use-case";
import { FinancialHealthStatus } from "@/modules/reports/domain/enums/financial-health-status.enum";
import { FinancialHealthPillarScoreDto } from "@/modules/reports/presentation/graphql/dtos/financial-health-pillar-score.dto";

@ObjectType()
export class FinancialHealthScoreResponseDto {
  static fromView(
    view: FinancialHealthScoreView,
  ): FinancialHealthScoreResponseDto {
    const dto = new FinancialHealthScoreResponseDto();
    dto.score = view.score;
    dto.status = view.status;
    dto.debtCommitment = FinancialHealthPillarScoreDto.fromView(
      view.debtCommitment,
    );
    dto.punctuality = FinancialHealthPillarScoreDto.fromView(view.punctuality);
    dto.reserves = view.reserves
      ? FinancialHealthPillarScoreDto.fromView(view.reserves)
      : undefined;
    dto.periodStart = view.periodStart;
    dto.periodEnd = view.periodEnd;
    return dto;
  }

  @Field(() => Int)
  score!: number;

  @Field(() => FinancialHealthStatus)
  status!: FinancialHealthStatus;

  @Field(() => FinancialHealthPillarScoreDto)
  debtCommitment!: FinancialHealthPillarScoreDto;

  @Field(() => FinancialHealthPillarScoreDto)
  punctuality!: FinancialHealthPillarScoreDto;

  @Field(() => FinancialHealthPillarScoreDto, { nullable: true })
  reserves?: FinancialHealthPillarScoreDto;

  @Field(() => Date)
  periodStart!: Date;

  @Field(() => Date)
  periodEnd!: Date;
}
