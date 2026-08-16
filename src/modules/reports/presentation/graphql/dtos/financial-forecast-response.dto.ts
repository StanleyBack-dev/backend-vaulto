import { Field, Float, ObjectType } from "@nestjs/graphql";
import type { FinancialForecastView } from "@/modules/reports/application/use-cases/get-financial-forecast.use-case";

@ObjectType()
export class FinancialForecastResponseDto {
  static fromView(view: FinancialForecastView): FinancialForecastResponseDto {
    const dto = new FinancialForecastResponseDto();
    dto.currentBalance = view.currentBalance;
    dto.projectedIncome = view.projectedIncome;
    dto.projectedExpenses = view.projectedExpenses;
    dto.safeToSpend = view.safeToSpend;
    dto.periodStart = view.periodStart;
    dto.periodEnd = view.periodEnd;
    return dto;
  }

  @Field(() => Float)
  currentBalance!: number;

  @Field(() => Float)
  projectedIncome!: number;

  @Field(() => Float)
  projectedExpenses!: number;

  @Field(() => Float)
  safeToSpend!: number;

  @Field(() => Date)
  periodStart!: Date;

  @Field(() => Date)
  periodEnd!: Date;
}
