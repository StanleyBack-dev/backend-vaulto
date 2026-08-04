import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "@/modules/auth/auth.module";
import { PAYMENT_REPOSITORY } from "@/modules/payments/application/ports/payment-repository.port";
import { ListDebtPaymentsUseCase } from "@/modules/payments/application/use-cases/list-debt-payments.use-case";
import { RegisterInstallmentPaymentUseCase } from "@/modules/payments/application/use-cases/register-installment-payment.use-case";
import { UpdateDebtPaymentUseCase } from "@/modules/payments/application/use-cases/update-debt-payment.use-case";
import { DeleteDebtPaymentUseCase } from "@/modules/payments/application/use-cases/delete-debt-payment.use-case";
import { DebtPaymentEntity } from "@/modules/payments/infrastructure/persistence/typeorm/entities/debt-payment.entity";
import { PaymentTypeormRepository } from "@/modules/payments/infrastructure/persistence/typeorm/repositories/payment-typeorm.repository";
import { PaymentsResolver } from "@/modules/payments/presentation/graphql/resolvers/payments.resolver";

@Module({
  imports: [TypeOrmModule.forFeature([DebtPaymentEntity]), AuthModule],
  providers: [
    RegisterInstallmentPaymentUseCase,
    ListDebtPaymentsUseCase,
    UpdateDebtPaymentUseCase,
    DeleteDebtPaymentUseCase,
    PaymentsResolver,
    PaymentTypeormRepository,
    {
      provide: PAYMENT_REPOSITORY,
      useExisting: PaymentTypeormRepository,
    },
  ],
})
export class PaymentsModule {}
