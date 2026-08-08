import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { toDateOnlyString } from "@/common/utils/date.util";
import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";
import { DebtEntity } from "@/modules/debts/infrastructure/persistence/typeorm/entities/debt.entity";
import { DebtInstallmentEntity } from "@/modules/debts/infrastructure/persistence/typeorm/entities/debt-installment.entity";
import { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";
import { IncomeEntity } from "@/modules/incomes/infrastructure/persistence/typeorm/entities/income.entity";
import { IncomeInstallmentEntity } from "@/modules/incomes/infrastructure/persistence/typeorm/entities/income-installment.entity";
import type {
  DebtsReportFilters,
  DebtsReportStatusCounts,
  DebtsReportView,
  IncomesReportFilters,
  IncomesReportStatusCounts,
  IncomesReportView,
  ReportRepositoryPort,
} from "@/modules/reports/application/ports/report-repository.port";

type DebtsReportRawRow = {
  status: DebtStatus;
  amountDue: string | null;
  amountPaid: string | null;
  count: string;
};

type IncomesReportRawRow = {
  status: IncomeStatus;
  amountDue: string | null;
  amountReceived: string | null;
  count: string;
};

function round2(value: number): number {
  return Number(value.toFixed(2));
}

@Injectable()
export class ReportTypeormRepository implements ReportRepositoryPort {
  constructor(
    @InjectRepository(DebtInstallmentEntity)
    private readonly installmentRepository: Repository<DebtInstallmentEntity>,
    @InjectRepository(IncomeInstallmentEntity)
    private readonly incomeInstallmentRepository: Repository<IncomeInstallmentEntity>,
  ) {}

  async getDebtsReport(
    idUsers: string,
    filters?: DebtsReportFilters,
  ): Promise<DebtsReportView> {
    const qb = this.installmentRepository
      .createQueryBuilder("installment")
      .innerJoin(
        DebtEntity,
        "debt",
        "CAST(debt.idDebt AS varchar) = installment.idDebt",
      )
      .where("debt.idUsers = :idUsers", { idUsers });

    if (filters?.dueDateFrom) {
      qb.andWhere("installment.dueDate >= :dueDateFrom", {
        dueDateFrom: toDateOnlyString(filters.dueDateFrom),
      });
    }

    if (filters?.dueDateTo) {
      qb.andWhere("installment.dueDate <= :dueDateTo", {
        dueDateTo: toDateOnlyString(filters.dueDateTo),
      });
    }

    if (filters?.debtType) {
      qb.andWhere("debt.debtType = :debtType", { debtType: filters.debtType });
    }

    if (filters?.idCategory) {
      qb.andWhere("debt.idCategory = :idCategory", {
        idCategory: filters.idCategory,
      });
    }

    const rows = await qb
      .select("installment.status", "status")
      .addSelect("SUM(installment.amountDue)", "amountDue")
      .addSelect("SUM(installment.amountPaid)", "amountPaid")
      .addSelect("COUNT(*)", "count")
      .groupBy("installment.status")
      .getRawMany<DebtsReportRawRow>();

    const countByStatus: DebtsReportStatusCounts = {
      open: 0,
      overdue: 0,
      partiallyPaid: 0,
      paid: 0,
    };

    let totalAmountDue = 0;
    let totalAmountPaid = 0;
    let totalCount = 0;

    for (const row of rows) {
      const amountDue = Number(row.amountDue) || 0;
      const amountPaid = Number(row.amountPaid) || 0;
      const count = Number(row.count) || 0;

      totalAmountDue += amountDue;
      totalAmountPaid += amountPaid;
      totalCount += count;

      switch (row.status) {
        case DebtStatus.OPEN:
          countByStatus.open += count;
          break;
        case DebtStatus.OVERDUE:
          countByStatus.overdue += count;
          break;
        case DebtStatus.PARTIALLY_PAID:
          countByStatus.partiallyPaid += count;
          break;
        case DebtStatus.PAID:
          countByStatus.paid += count;
          break;
      }
    }

    return {
      totalAmountDue: round2(totalAmountDue),
      totalAmountPaid: round2(totalAmountPaid),
      totalOutstanding: round2(Math.max(totalAmountDue - totalAmountPaid, 0)),
      totalCount,
      countByStatus,
    };
  }

  async getIncomesReport(
    idUsers: string,
    filters?: IncomesReportFilters,
  ): Promise<IncomesReportView> {
    const qb = this.incomeInstallmentRepository
      .createQueryBuilder("installment")
      .innerJoin(
        IncomeEntity,
        "income",
        "CAST(income.idIncome AS varchar) = installment.idIncome",
      )
      .where("income.idUsers = :idUsers", { idUsers });

    if (filters?.dueDateFrom) {
      qb.andWhere("installment.dueDate >= :dueDateFrom", {
        dueDateFrom: toDateOnlyString(filters.dueDateFrom),
      });
    }

    if (filters?.dueDateTo) {
      qb.andWhere("installment.dueDate <= :dueDateTo", {
        dueDateTo: toDateOnlyString(filters.dueDateTo),
      });
    }

    if (filters?.incomeType) {
      qb.andWhere("income.incomeType = :incomeType", {
        incomeType: filters.incomeType,
      });
    }

    if (filters?.idCategory) {
      qb.andWhere("income.idCategory = :idCategory", {
        idCategory: filters.idCategory,
      });
    }

    const rows = await qb
      .select("installment.status", "status")
      .addSelect("SUM(installment.amountDue)", "amountDue")
      .addSelect("SUM(installment.amountReceived)", "amountReceived")
      .addSelect("COUNT(*)", "count")
      .groupBy("installment.status")
      .getRawMany<IncomesReportRawRow>();

    const countByStatus: IncomesReportStatusCounts = {
      pending: 0,
      overdue: 0,
      partiallyReceived: 0,
      received: 0,
    };

    let totalAmountDue = 0;
    let totalAmountReceived = 0;
    let totalCount = 0;

    for (const row of rows) {
      const amountDue = Number(row.amountDue) || 0;
      const amountReceived = Number(row.amountReceived) || 0;
      const count = Number(row.count) || 0;

      totalAmountDue += amountDue;
      totalAmountReceived += amountReceived;
      totalCount += count;

      switch (row.status) {
        case IncomeStatus.PENDING:
          countByStatus.pending += count;
          break;
        case IncomeStatus.OVERDUE:
          countByStatus.overdue += count;
          break;
        case IncomeStatus.PARTIALLY_RECEIVED:
          countByStatus.partiallyReceived += count;
          break;
        case IncomeStatus.RECEIVED:
          countByStatus.received += count;
          break;
      }
    }

    return {
      totalAmountDue: round2(totalAmountDue),
      totalAmountReceived: round2(totalAmountReceived),
      totalOutstanding: round2(
        Math.max(totalAmountDue - totalAmountReceived, 0),
      ),
      totalCount,
      countByStatus,
    };
  }
}
