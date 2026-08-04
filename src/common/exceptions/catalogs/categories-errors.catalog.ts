import { HttpStatus } from "@nestjs/common";

export const categoriesErrors = {
  notFound: {
    code: "CATEGORIES_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: "Categoria nao encontrada.",
  },
  duplicatedName: {
    code: "CATEGORIES_DUPLICATED_NAME",
    status: HttpStatus.CONFLICT,
    message: "Ja existe uma categoria com este nome.",
  },
} as const;
