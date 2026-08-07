import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "@/modules/auth/auth.module";
import { BillingModule } from "@/modules/billing/billing.module";
import { DebtEntity } from "@/modules/debts/infrastructure/persistence/typeorm/entities/debt.entity";
import { DebtInstallmentEntity } from "@/modules/debts/infrastructure/persistence/typeorm/entities/debt-installment.entity";
import { CREDIT_CARD_REPOSITORY } from "@/modules/credit-cards/application/ports/credit-card-repository.port";
import { CreateCreditCardUseCase } from "@/modules/credit-cards/application/use-cases/create/create-credit-card.use-case";
import { GetCreditCardByIdUseCase } from "@/modules/credit-cards/application/use-cases/get/get-credit-card-by-id.use-case";
import { ListCreditCardsUseCase } from "@/modules/credit-cards/application/use-cases/get/list-credit-cards.use-case";
import { UpdateCreditCardUseCase } from "@/modules/credit-cards/application/use-cases/update/update-credit-card.use-case";
import { CreditCardEntity } from "@/modules/credit-cards/infrastructure/persistence/typeorm/entities/credit-card.entity";
import { CreditCardTypeormRepository } from "@/modules/credit-cards/infrastructure/persistence/typeorm/repositories/credit-card-typeorm.repository";
import { CreditCardsResolver } from "@/modules/credit-cards/presentation/graphql/resolvers/credit-cards.resolver";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CreditCardEntity,
      DebtEntity,
      DebtInstallmentEntity,
    ]),
    AuthModule,
    BillingModule,
  ],
  providers: [
    CreateCreditCardUseCase,
    ListCreditCardsUseCase,
    GetCreditCardByIdUseCase,
    UpdateCreditCardUseCase,
    CreditCardsResolver,
    CreditCardTypeormRepository,
    {
      provide: CREDIT_CARD_REPOSITORY,
      useExisting: CreditCardTypeormRepository,
    },
  ],
  exports: [CREDIT_CARD_REPOSITORY],
})
export class CreditCardsModule {}
