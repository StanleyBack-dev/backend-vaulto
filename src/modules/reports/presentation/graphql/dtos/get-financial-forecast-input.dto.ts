import { Field, Float, InputType } from "@nestjs/graphql";

@InputType()
export class GetFinancialForecastInputDto {
  @Field(() => Float)
  currentBalance!: number;

  @Field(() => Date, { nullable: true })
  periodStart?: Date;

  @Field(() => Date, { nullable: true })
  periodEnd?: Date;
}
