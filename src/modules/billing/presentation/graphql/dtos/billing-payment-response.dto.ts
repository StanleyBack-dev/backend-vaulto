import { Field, Float, ObjectType } from "@nestjs/graphql";
import type { BillingPaymentView } from "@/modules/billing/application/ports/billing-payment-repository.port";
import { BillingPaymentStatus } from "@/modules/billing/domain/enums/billing-payment-status.enum";

@ObjectType()
export class BillingPaymentResponseDto {
  static fromView(view: BillingPaymentView): BillingPaymentResponseDto {
    const dto = new BillingPaymentResponseDto();
    dto.amount = view.amount;
    dto.status = view.status;
    dto.dueDate = view.dueDate;
    dto.paidAt = view.paidAt;
    dto.createdAt = view.createdAt;
    return dto;
  }

  @Field(() => Float)
  amount!: number;

  @Field(() => BillingPaymentStatus)
  status!: BillingPaymentStatus;

  @Field(() => Date, { nullable: true })
  dueDate?: Date;

  @Field(() => Date, { nullable: true })
  paidAt?: Date;

  @Field(() => Date)
  createdAt!: Date;
}
