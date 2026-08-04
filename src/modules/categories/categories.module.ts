import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "@/modules/auth/auth.module";
import { CATEGORY_REPOSITORY } from "@/modules/categories/application/ports/category-repository.port";
import { CreateCategoryUseCase } from "@/modules/categories/application/use-cases/create/create-category.use-case";
import { SeedDefaultCategoriesUseCase } from "@/modules/categories/application/use-cases/create/seed-default-categories.use-case";
import { GetCategoryByIdUseCase } from "@/modules/categories/application/use-cases/get/get-category-by-id.use-case";
import { ListCategoriesUseCase } from "@/modules/categories/application/use-cases/get/list-categories.use-case";
import { UpdateCategoryUseCase } from "@/modules/categories/application/use-cases/update/update-category.use-case";
import { CategoryEntity } from "@/modules/categories/infrastructure/persistence/typeorm/entities/category.entity";
import { CategoryTypeormRepository } from "@/modules/categories/infrastructure/persistence/typeorm/repositories/category-typeorm.repository";
import { CategoriesResolver } from "@/modules/categories/presentation/graphql/resolvers/categories.resolver";

@Module({
  imports: [TypeOrmModule.forFeature([CategoryEntity]), AuthModule],
  providers: [
    CreateCategoryUseCase,
    SeedDefaultCategoriesUseCase,
    ListCategoriesUseCase,
    GetCategoryByIdUseCase,
    UpdateCategoryUseCase,
    CategoriesResolver,
    CategoryTypeormRepository,
    {
      provide: CATEGORY_REPOSITORY,
      useExisting: CategoryTypeormRepository,
    },
  ],
  exports: [CATEGORY_REPOSITORY, SeedDefaultCategoriesUseCase],
})
export class CategoriesModule {}
