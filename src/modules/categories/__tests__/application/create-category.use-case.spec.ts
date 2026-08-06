import { AppException } from "@/common/exceptions/app-exception";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { CreateCategoryUseCase } from "@/modules/categories/application/use-cases/create/create-category.use-case";
import { CategoryType } from "@/modules/categories/domain/enums/category-type.enum";

describe("CreateCategoryUseCase", () => {
  it("should create a category with a trimmed name and default type/status", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const categoryRepository = {
      findByName: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((payload) =>
        Promise.resolve({
          idCategory: "category-1",
          idUsers: payload.idUsers,
          name: payload.name,
          type: payload.type,
          status: payload.status,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ),
    };

    const useCase = new CreateCategoryUseCase(
      authorizationService as never,
      categoryRepository as never,
    );

    const result = await useCase.execute("user-1", {
      name: "  Moradia  ",
    } as never);

    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "user-1",
      AuthPermission.MANAGE_OWN_DEBTS,
    );
    expect(categoryRepository.findByName).toHaveBeenCalledWith(
      "user-1",
      "Moradia",
    );
    expect(categoryRepository.create).toHaveBeenCalledWith({
      idUsers: "user-1",
      name: "Moradia",
      type: CategoryType.EXPENSE,
      status: true,
    });
    expect(result.name).toBe("Moradia");
  });

  it("should create an income-type category when requested", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const categoryRepository = {
      findByName: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((payload) =>
        Promise.resolve({
          idCategory: "category-1",
          ...payload,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ),
    };

    const useCase = new CreateCategoryUseCase(
      authorizationService as never,
      categoryRepository as never,
    );

    const result = await useCase.execute("user-1", {
      name: "Salário",
      type: CategoryType.INCOME,
    } as never);

    expect(result.type).toBe(CategoryType.INCOME);
  });

  it("should reject an empty (whitespace-only) name", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const categoryRepository = {
      findByName: jest.fn(),
      create: jest.fn(),
    };

    const useCase = new CreateCategoryUseCase(
      authorizationService as never,
      categoryRepository as never,
    );

    await expect(
      useCase.execute("user-1", { name: "   " } as never),
    ).rejects.toBeInstanceOf(AppException);

    expect(categoryRepository.create).not.toHaveBeenCalled();
  });

  it("should reject a duplicated name for the same user", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const categoryRepository = {
      findByName: jest.fn().mockResolvedValue({
        idCategory: "category-existing",
        idUsers: "user-1",
        name: "Moradia",
        type: CategoryType.EXPENSE,
        status: true,
      }),
      create: jest.fn(),
    };

    const useCase = new CreateCategoryUseCase(
      authorizationService as never,
      categoryRepository as never,
    );

    await expect(
      useCase.execute("user-1", { name: "Moradia" } as never),
    ).rejects.toBeInstanceOf(AppException);

    expect(categoryRepository.create).not.toHaveBeenCalled();
  });
});
