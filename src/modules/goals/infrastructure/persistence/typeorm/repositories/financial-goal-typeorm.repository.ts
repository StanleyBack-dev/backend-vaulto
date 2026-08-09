import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import {
  type CreateFinancialGoalPayload,
  type FinancialGoalRepositoryPort,
  type FinancialGoalView,
  type GoalContributionView,
  type ListFinancialGoalsFilters,
  type RegisterGoalContributionPayload,
  type UpdateFinancialGoalPayload,
  type UpdateGoalContributionPayload,
} from "@/modules/goals/application/ports/financial-goal-repository.port";
import { FinancialGoalEntity } from "@/modules/goals/infrastructure/persistence/typeorm/entities/financial-goal.entity";
import { GoalContributionEntity } from "@/modules/goals/infrastructure/persistence/typeorm/entities/goal-contribution.entity";

@Injectable()
export class FinancialGoalTypeormRepository
  implements FinancialGoalRepositoryPort
{
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(FinancialGoalEntity)
    private readonly goalRepository: Repository<FinancialGoalEntity>,
    @InjectRepository(GoalContributionEntity)
    private readonly contributionRepository: Repository<GoalContributionEntity>,
  ) {}

  async create(
    payload: CreateFinancialGoalPayload,
  ): Promise<FinancialGoalView> {
    const created = this.goalRepository.create({
      idUsers: payload.idUsers,
      title: payload.title,
      description: payload.description,
      targetAmount: payload.targetAmount.toFixed(2),
      targetDate: payload.targetDate,
    });

    const saved = await this.goalRepository.save(created);

    return this.mapToView(saved, []);
  }

  async listByUser(
    idUsers: string,
    filters?: ListFinancialGoalsFilters,
  ): Promise<{ records: FinancialGoalView[]; total: number }> {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 10;

    const [rows, total] = await this.goalRepository
      .createQueryBuilder("goal")
      .where("goal.idUsers = :idUsers", { idUsers })
      .orderBy("goal.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const ids = rows.map((row) => row.idFinancialGoal);
    const contributions = ids.length
      ? await this.contributionRepository.find({
          where: { idFinancialGoal: In(ids) },
          order: { contributedAt: "DESC" },
        })
      : [];

    const contributionsByGoal = new Map<string, GoalContributionEntity[]>();
    for (const contribution of contributions) {
      const current =
        contributionsByGoal.get(contribution.idFinancialGoal) ?? [];
      current.push(contribution);
      contributionsByGoal.set(contribution.idFinancialGoal, current);
    }

    return {
      records: rows.map((row) =>
        this.mapToView(
          row,
          contributionsByGoal.get(row.idFinancialGoal) ?? [],
        ),
      ),
      total,
    };
  }

  async findById(
    idUsers: string,
    idFinancialGoal: string,
  ): Promise<FinancialGoalView> {
    const goal = await this.goalRepository.findOne({
      where: { idFinancialGoal, idUsers },
    });

    if (!goal) {
      throw AppException.from(APP_ERRORS.goals.notFound, undefined);
    }

    const contributions = await this.contributionRepository.find({
      where: { idFinancialGoal: goal.idFinancialGoal },
      order: { contributedAt: "DESC" },
    });

    return this.mapToView(goal, contributions);
  }

  async update(
    idUsers: string,
    payload: UpdateFinancialGoalPayload,
  ): Promise<FinancialGoalView> {
    const goal = await this.goalRepository.findOne({
      where: { idFinancialGoal: payload.idFinancialGoal, idUsers },
    });

    if (!goal) {
      throw AppException.from(APP_ERRORS.goals.notFound, undefined);
    }

    if (payload.title !== undefined) {
      goal.title = payload.title;
    }
    if (payload.description !== undefined) {
      goal.description = payload.description;
    }
    if (payload.targetAmount !== undefined) {
      goal.targetAmount = payload.targetAmount.toFixed(2);
    }
    if (payload.targetDate !== undefined) {
      goal.targetDate = payload.targetDate ?? undefined;
    }

    const saved = await this.goalRepository.save(goal);

    const contributions = await this.contributionRepository.find({
      where: { idFinancialGoal: saved.idFinancialGoal },
      order: { contributedAt: "DESC" },
    });

    return this.mapToView(saved, contributions);
  }

  async delete(idUsers: string, idFinancialGoal: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const goalRepository = manager.getRepository(FinancialGoalEntity);

      const goal = await goalRepository.findOne({
        where: { idFinancialGoal, idUsers },
      });

      if (!goal) {
        throw AppException.from(APP_ERRORS.goals.notFound, undefined);
      }

      await manager
        .getRepository(GoalContributionEntity)
        .delete({ idFinancialGoal: goal.idFinancialGoal });
      await goalRepository.delete({ idFinancialGoal: goal.idFinancialGoal });
    });
  }

  async registerContribution(
    idUsers: string,
    payload: RegisterGoalContributionPayload,
  ): Promise<FinancialGoalView> {
    const goal = await this.goalRepository.findOne({
      where: { idFinancialGoal: payload.idFinancialGoal, idUsers },
    });

    if (!goal) {
      throw AppException.from(APP_ERRORS.goals.notFound, undefined);
    }

    const contribution = this.contributionRepository.create({
      idFinancialGoal: goal.idFinancialGoal,
      amount: payload.amount.toFixed(2),
      contributedAt: payload.contributedAt ?? new Date(),
      note: payload.note,
    });
    await this.contributionRepository.save(contribution);

    const contributions = await this.contributionRepository.find({
      where: { idFinancialGoal: goal.idFinancialGoal },
      order: { contributedAt: "DESC" },
    });

    return this.mapToView(goal, contributions);
  }

  async updateContribution(
    idUsers: string,
    payload: UpdateGoalContributionPayload,
  ): Promise<FinancialGoalView> {
    const goal = await this.goalRepository.findOne({
      where: { idFinancialGoal: payload.idFinancialGoal, idUsers },
    });

    if (!goal) {
      throw AppException.from(APP_ERRORS.goals.notFound, undefined);
    }

    const contribution = await this.contributionRepository.findOne({
      where: {
        idGoalContribution: payload.idGoalContribution,
        idFinancialGoal: goal.idFinancialGoal,
      },
    });

    if (!contribution) {
      throw AppException.from(
        APP_ERRORS.goals.contributionNotFound,
        undefined,
      );
    }

    if (payload.amount !== undefined) {
      contribution.amount = payload.amount.toFixed(2);
    }
    if (payload.contributedAt !== undefined) {
      contribution.contributedAt = payload.contributedAt;
    }
    if (payload.note !== undefined) {
      contribution.note = payload.note;
    }

    await this.contributionRepository.save(contribution);

    const contributions = await this.contributionRepository.find({
      where: { idFinancialGoal: goal.idFinancialGoal },
      order: { contributedAt: "DESC" },
    });

    return this.mapToView(goal, contributions);
  }

  async deleteContribution(
    idUsers: string,
    idFinancialGoal: string,
    idGoalContribution: string,
  ): Promise<FinancialGoalView> {
    const goal = await this.goalRepository.findOne({
      where: { idFinancialGoal, idUsers },
    });

    if (!goal) {
      throw AppException.from(APP_ERRORS.goals.notFound, undefined);
    }

    const contribution = await this.contributionRepository.findOne({
      where: { idGoalContribution, idFinancialGoal: goal.idFinancialGoal },
    });

    if (!contribution) {
      throw AppException.from(APP_ERRORS.goals.contributionNotFound, undefined);
    }

    await this.contributionRepository.delete({ idGoalContribution });

    const contributions = await this.contributionRepository.find({
      where: { idFinancialGoal: goal.idFinancialGoal },
      order: { contributedAt: "DESC" },
    });

    return this.mapToView(goal, contributions);
  }

  private mapContributionToView(
    entity: GoalContributionEntity,
  ): GoalContributionView {
    return {
      idGoalContribution: entity.idGoalContribution,
      idFinancialGoal: entity.idFinancialGoal,
      amount: Number(entity.amount),
      contributedAt: entity.contributedAt,
      note: entity.note,
      createdAt: entity.createdAt,
    };
  }

  private mapToView(
    entity: FinancialGoalEntity,
    contributions: GoalContributionEntity[],
  ): FinancialGoalView {
    const currentAmount = contributions.reduce(
      (sum, contribution) => sum + Number(contribution.amount),
      0,
    );

    return {
      idFinancialGoal: entity.idFinancialGoal,
      idUsers: entity.idUsers,
      title: entity.title,
      description: entity.description,
      targetAmount: Number(entity.targetAmount),
      currentAmount: Number(currentAmount.toFixed(2)),
      targetDate: entity.targetDate,
      contributions: contributions.map((contribution) =>
        this.mapContributionToView(contribution),
      ),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
