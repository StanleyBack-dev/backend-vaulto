import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";

export class Money {
  private constructor(private readonly amount: number) {}

  static from(value: number): Money {
    if (!Number.isFinite(value) || value <= 0) {
      throw AppException.from(APP_ERRORS.debts.invalidAmount, undefined);
    }

    return new Money(Number(value.toFixed(2)));
  }

  toNumber(): number {
    return this.amount;
  }
}
