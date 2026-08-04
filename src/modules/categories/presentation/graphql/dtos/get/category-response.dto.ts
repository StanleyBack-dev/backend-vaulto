import { Field, ObjectType } from "@nestjs/graphql";
import type { CategoryView } from "@/modules/categories/application/ports/category-repository.port";

@ObjectType()
export class CategoryResponseDto {
  static fromView(view: CategoryView): CategoryResponseDto {
    const dto = new CategoryResponseDto();
    dto.idCategory = view.idCategory;
    dto.idUsers = view.idUsers;
    dto.name = view.name;
    dto.status = view.status;
    dto.inactivatedAt = view.inactivatedAt;
    dto.createdAt = view.createdAt;
    dto.updatedAt = view.updatedAt;
    return dto;
  }

  @Field()
  idCategory!: string;

  @Field()
  idUsers!: string;

  @Field()
  name!: string;

  @Field()
  status!: boolean;

  @Field(() => Date, { nullable: true })
  inactivatedAt?: Date;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
