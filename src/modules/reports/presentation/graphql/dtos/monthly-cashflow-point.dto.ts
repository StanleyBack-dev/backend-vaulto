import { Field, Float, ObjectType } from "@nestjs/graphql";
import type { MonthlyCashflowPoint } from "@/modules/reports/application/use-cases/get-monthly-cashflow-trend.use-case";

@ObjectType()
export class MonthlyCashflowPointDto {
  static fromView(view: MonthlyCashflowPoint): MonthlyCashflowPointDto {
    const dto = new MonthlyCashflowPointDto();
    dto.month = view.month;
    dto.expenses = view.expenses;
    dto.income = view.income;
    dto.balance = view.balance;
    return dto;
  }

  @Field(() => String)
  month!: string;

  @Field(() => Float)
  expenses!: number;

  @Field(() => Float)
  income!: number;

  @Field(() => Float)
  balance!: number;
}
