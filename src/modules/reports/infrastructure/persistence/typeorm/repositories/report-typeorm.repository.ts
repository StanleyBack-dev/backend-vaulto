import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { toDateOnlyString } from "@/common/utils/date.util";
import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";
import { DebtEntity } from "@/modules/debts/infrastructure/persistence/typeorm/entities/debt.entity";
import { DebtInstallmentEntity } from "@/modules/debts/infrastructure/persistence/typeorm/entities/debt-installment.entity";
import type {
  DebtsReportFilters,
  DebtsReportStatusCounts,
  DebtsReportView,
  ReportRepositoryPort,
} from "@/modules/reports/application/ports/report-repository.port";

type DebtsReportRawRow = {
  status: DebtStatus;
  amountDue: string | null;
  amountPaid: string | null;
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
}
