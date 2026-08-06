import { AppException } from "@/common/exceptions/app-exception";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { UpdateCategoryUseCase } from "@/modules/categories/application/use-cases/update/update-category.use-case";
import { CategoryType } from "@/modules/categories/domain/enums/category-type.enum";

describe("UpdateCategoryUseCase", () => {
  it("should update the category with a trimmed name", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const categoryRepository = {
      findById: jest.fn().mockResolvedValue({
        idCategory: "category-1",
        idUsers: "user-1",
        name: "Moradia",
        type: CategoryType.EXPENSE,
        status: true,
      }),
      findByName: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockImplementation((payload) =>
        Promise.resolve({
          ...payload,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ),
    };

    const useCase = new UpdateCategoryUseCase(
      authorizationService as never,
      categoryRepository as never,
    );

    const result = await useCase.execute("user-1", {
      idCategory: "category-1",
      name: "  Moradia e aluguel  ",
    } as never);

    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "user-1",
      AuthPermission.MANAGE_OWN_DEBTS,
    );
    expect(categoryRepository.update).toHaveBeenCalledWith({
      idUsers: "user-1",
      idCategory: "category-1",
      name: "Moradia e aluguel",
      type: CategoryType.EXPENSE,
      status: undefined,
    });
    expect(result.name).toBe("Moradia e aluguel");
  });

  it("should keep the current type when no type is provided", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const categoryRepository = {
      findById: jest.fn().mockResolvedValue({
        idCategory: "category-1",
        idUsers: "user-1",
        name: "Salário",
        type: CategoryType.INCOME,
        status: true,
      }),
      findByName: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockImplementation((payload) =>
        Promise.resolve({
          ...payload,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ),
    };

    const useCase = new UpdateCategoryUseCase(
      authorizationService as never,
      categoryRepository as never,
    );

    const result = await useCase.execute("user-1", {
      idCategory: "category-1",
      name: "Salário",
    } as never);

    expect(result.type).toBe(CategoryType.INCOME);
  });

  it("should reject an empty (whitespace-only) name", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const categoryRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      update: jest.fn(),
    };

    const useCase = new UpdateCategoryUseCase(
      authorizationService as never,
      categoryRepository as never,
    );

    await expect(
      useCase.execute("user-1", {
        idCategory: "category-1",
        name: "   ",
      } as never),
    ).rejects.toBeInstanceOf(AppException);

    expect(categoryRepository.update).not.toHaveBeenCalled();
  });

  it("should reject updating a category that does not belong to (or does not exist for) the user", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const categoryRepository = {
      findById: jest.fn().mockResolvedValue(null),
      findByName: jest.fn(),
      update: jest.fn(),
    };

    const useCase = new UpdateCategoryUseCase(
      authorizationService as never,
      categoryRepository as never,
    );

    await expect(
      useCase.execute("user-1", {
        idCategory: "category-missing",
        name: "Moradia",
      } as never),
    ).rejects.toBeInstanceOf(AppException);

    expect(categoryRepository.update).not.toHaveBeenCalled();
  });

  it("should reject renaming to a name already used by a different category", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const categoryRepository = {
      findById: jest.fn().mockResolvedValue({
        idCategory: "category-1",
        idUsers: "user-1",
        name: "Moradia",
        type: CategoryType.EXPENSE,
        status: true,
      }),
      findByName: jest.fn().mockResolvedValue({
        idCategory: "category-2",
        idUsers: "user-1",
        name: "Transporte",
        type: CategoryType.EXPENSE,
        status: true,
      }),
      update: jest.fn(),
    };

    const useCase = new UpdateCategoryUseCase(
      authorizationService as never,
      categoryRepository as never,
    );

    await expect(
      useCase.execute("user-1", {
        idCategory: "category-1",
        name: "Transporte",
      } as never),
    ).rejects.toBeInstanceOf(AppException);

    expect(categoryRepository.update).not.toHaveBeenCalled();
  });

  it("should allow keeping the category's own current name unchanged", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const categoryRepository = {
      findById: jest.fn().mockResolvedValue({
        idCategory: "category-1",
        idUsers: "user-1",
        name: "Moradia",
        type: CategoryType.EXPENSE,
        status: true,
      }),
      // findByName resolves to the very same category being updated —
      // must not be treated as a name collision.
      findByName: jest.fn().mockResolvedValue({
        idCategory: "category-1",
        idUsers: "user-1",
        name: "Moradia",
        type: CategoryType.EXPENSE,
        status: true,
      }),
      update: jest.fn().mockImplementation((payload) =>
        Promise.resolve({
          ...payload,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ),
    };

    const useCase = new UpdateCategoryUseCase(
      authorizationService as never,
      categoryRepository as never,
    );

    const result = await useCase.execute("user-1", {
      idCategory: "category-1",
      name: "Moradia",
      status: false,
    } as never);

    expect(categoryRepository.update).toHaveBeenCalledTimes(1);
    expect(result.status).toBe(false);
  });
});
