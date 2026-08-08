import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { toDateOnlyString } from "@/common/utils/date.util";
import { SubscriptionEntity } from "@/modules/billing/infrastructure/persistence/typeorm/entities/subscription.entity";
import { SubscriptionPlan } from "@/modules/billing/domain/enums/subscription-plan.enum";
import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";
import { DebtEntity } from "@/modules/debts/infrastructure/persistence/typeorm/entities/debt.entity";
import { DebtInstallmentEntity } from "@/modules/debts/infrastructure/persistence/typeorm/entities/debt-installment.entity";
import { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";
import { IncomeEntity } from "@/modules/incomes/infrastructure/persistence/typeorm/entities/income.entity";
import { IncomeInstallmentEntity } from "@/modules/incomes/infrastructure/persistence/typeorm/entities/income-installment.entity";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";
import type {
  DueTomorrowUserReminder,
  RemindersRepositoryPort,
} from "@/modules/reminders/application/ports/reminders-repository.port";

type DueTomorrowRawRow = {
  idUsers: string;
  name: string;
  email: string;
  title: string;
  amountDue: string;
};

@Injectable()
export class RemindersTypeormRepository implements RemindersRepositoryPort {
  constructor(
    @InjectRepository(DebtInstallmentEntity)
    private readonly debtInstallmentRepository: Repository<DebtInstallmentEntity>,
    @InjectRepository(IncomeInstallmentEntity)
    private readonly incomeInstallmentRepository: Repository<IncomeInstallmentEntity>,
  ) {}

  async findProUsersWithDueTomorrow(
    dueDate: Date,
  ): Promise<DueTomorrowUserReminder[]> {
    const dueDateOnly = toDateOnlyString(dueDate);

    const [debtRows, incomeRows] = await Promise.all([
      this.debtInstallmentRepository
        .createQueryBuilder("installment")
        .innerJoin(
          DebtEntity,
          "debt",
          "CAST(debt.idDebt AS varchar) = installment.idDebt",
        )
        .innerJoin(
          UserEntity,
          "user",
          "CAST(user.idUsers AS varchar) = debt.idUsers",
        )
        .innerJoin(
          SubscriptionEntity,
          "subscription",
          "CAST(subscription.idUsers AS varchar) = debt.idUsers",
        )
        .where("installment.dueDate = :dueDateOnly", { dueDateOnly })
        .andWhere("installment.status != :paidStatus", {
          paidStatus: DebtStatus.PAID,
        })
        .andWhere("subscription.plan = :plan", { plan: SubscriptionPlan.PRO })
        .andWhere("user.status = true")
        .select("user.idUsers", "idUsers")
        .addSelect("user.name", "name")
        .addSelect("user.email", "email")
        .addSelect("debt.title", "title")
        .addSelect("installment.amountDue", "amountDue")
        .getRawMany<DueTomorrowRawRow>(),
      this.incomeInstallmentRepository
        .createQueryBuilder("installment")
        .innerJoin(
          IncomeEntity,
          "income",
          "CAST(income.idIncome AS varchar) = installment.idIncome",
        )
        .innerJoin(
          UserEntity,
          "user",
          "CAST(user.idUsers AS varchar) = income.idUsers",
        )
        .innerJoin(
          SubscriptionEntity,
          "subscription",
          "CAST(subscription.idUsers AS varchar) = income.idUsers",
        )
        .where("installment.dueDate = :dueDateOnly", { dueDateOnly })
        .andWhere("installment.status != :receivedStatus", {
          receivedStatus: IncomeStatus.RECEIVED,
        })
        .andWhere("subscription.plan = :plan", { plan: SubscriptionPlan.PRO })
        .andWhere("user.status = true")
        .select("user.idUsers", "idUsers")
        .addSelect("user.name", "name")
        .addSelect("user.email", "email")
        .addSelect("income.title", "title")
        .addSelect("installment.amountDue", "amountDue")
        .getRawMany<DueTomorrowRawRow>(),
    ]);

    const remindersByUser = new Map<string, DueTomorrowUserReminder>();

    const getOrCreateReminder = (row: DueTomorrowRawRow) => {
      let reminder = remindersByUser.get(row.idUsers);
      if (!reminder) {
        reminder = {
          idUsers: row.idUsers,
          name: row.name,
          email: row.email,
          debts: [],
          incomes: [],
        };
        remindersByUser.set(row.idUsers, reminder);
      }
      return reminder;
    };

    for (const row of debtRows) {
      getOrCreateReminder(row).debts.push({
        title: row.title,
        amountDue: Number(row.amountDue) || 0,
      });
    }

    for (const row of incomeRows) {
      getOrCreateReminder(row).incomes.push({
        title: row.title,
        amountDue: Number(row.amountDue) || 0,
      });
    }

    return Array.from(remindersByUser.values());
  }
}
