import { Field, Float, Int, ObjectType } from "@nestjs/graphql";
import type { FinancialHealthPillarScore } from "@/modules/reports/domain/services/financial-health-score.service";

@ObjectType()
export class FinancialHealthPillarScoreDto {
  static fromView(
    view: FinancialHealthPillarScore,
  ): FinancialHealthPillarScoreDto {
    const dto = new FinancialHealthPillarScoreDto();
    dto.score = view.score;
    dto.weight = view.weight;
    return dto;
  }

  @Field(() => Int)
  score!: number;

  @Field(() => Float)
  weight!: number;
}
