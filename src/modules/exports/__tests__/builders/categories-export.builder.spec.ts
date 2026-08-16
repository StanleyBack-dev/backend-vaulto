import type { CategoryView } from "@/modules/categories/application/ports/category-repository.port";
import { CategoryType } from "@/modules/categories/domain/enums/category-type.enum";
import { CategoriesExportBuilder } from "../../application/builders/categories-export.builder";

function categoryView(overrides: Partial<CategoryView> = {}): CategoryView {
  return {
    idCategory: "cat-1",
    idUsers: "user-1",
    name: "Alimentação",
    type: CategoryType.EXPENSE,
    status: true,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("CategoriesExportBuilder", () => {
  it("builds rows without a totals section", async () => {
    const categoryRepository = {
      listByUser: jest.fn().mockResolvedValue({
        records: [
          categoryView(),
          categoryView({
            idCategory: "cat-2",
            name: "Salário",
            type: CategoryType.INCOME,
            status: false,
          }),
        ],
        total: 2,
      }),
    };
    const builder = new CategoriesExportBuilder(categoryRepository as never);

    const payload = await builder.build("user-1", "Stanley", {});

    expect(payload.rows).toEqual([
      ["Alimentação", "Despesa", "Ativa"],
      ["Salário", "Receita", "Inativa"],
    ]);
    expect(payload.totals).toEqual([]);
  });

  it("forwards the active/type filters applied on screen", async () => {
    const categoryRepository = {
      listByUser: jest.fn().mockResolvedValue({ records: [], total: 0 }),
    };
    const builder = new CategoriesExportBuilder(categoryRepository as never);

    await builder.build("user-1", "Stanley", {
      activeOnly: true,
      categoryType: CategoryType.INCOME,
    });

    expect(categoryRepository.listByUser).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ status: true, type: CategoryType.INCOME }),
    );
  });
});
