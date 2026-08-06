import { SeedDefaultCategoriesUseCase } from "@/modules/categories/application/use-cases/create/seed-default-categories.use-case";
import {
  DEFAULT_CATEGORY_NAMES,
  DEFAULT_INCOME_CATEGORY_NAMES,
} from "@/modules/categories/domain/constants/default-categories.constant";
import { CategoryType } from "@/modules/categories/domain/enums/category-type.enum";

describe("SeedDefaultCategoriesUseCase", () => {
  it("should seed every default expense and income category for the user", async () => {
    const categoryRepository = {
      create: jest.fn().mockResolvedValue(undefined),
    };

    const useCase = new SeedDefaultCategoriesUseCase(
      categoryRepository as never,
    );

    await useCase.execute("user-1");

    const totalDefaults =
      DEFAULT_CATEGORY_NAMES.length + DEFAULT_INCOME_CATEGORY_NAMES.length;
    expect(categoryRepository.create).toHaveBeenCalledTimes(totalDefaults);

    for (const name of DEFAULT_CATEGORY_NAMES) {
      expect(categoryRepository.create).toHaveBeenCalledWith({
        idUsers: "user-1",
        name,
        type: CategoryType.EXPENSE,
        status: true,
      });
    }

    for (const name of DEFAULT_INCOME_CATEGORY_NAMES) {
      expect(categoryRepository.create).toHaveBeenCalledWith({
        idUsers: "user-1",
        name,
        type: CategoryType.INCOME,
        status: true,
      });
    }
  });
});
