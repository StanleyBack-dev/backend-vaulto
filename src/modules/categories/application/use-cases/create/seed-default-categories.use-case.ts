import { Inject, Injectable } from "@nestjs/common";
import {
  CATEGORY_REPOSITORY,
  type CategoryRepositoryPort,
} from "@/modules/categories/application/ports/category-repository.port";
import { DEFAULT_CATEGORY_NAMES } from "@/modules/categories/domain/constants/default-categories.constant";

@Injectable()
export class SeedDefaultCategoriesUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: CategoryRepositoryPort,
  ) {}

  async execute(idUsers: string): Promise<void> {
    for (const name of DEFAULT_CATEGORY_NAMES) {
      await this.categoryRepository.create({
        idUsers,
        name,
        status: true,
      });
    }
  }
}
