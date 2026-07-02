import { HttpStatus } from "@nestjs/common";

export const pdfErrors = {
  templateNotMapped: {
    code: "PDF_TEMPLATE_NOT_MAPPED",
    status: HttpStatus.BAD_REQUEST,
    message: "Template de PDF não mapeado para a chave informada.",
  },
  templateNotFound: {
    code: "PDF_TEMPLATE_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: "Template de PDF não encontrado.",
  },
};
