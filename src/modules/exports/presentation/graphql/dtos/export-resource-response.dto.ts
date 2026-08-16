import { Field, ObjectType } from "@nestjs/graphql";
import type { ExportResourceOutput } from "../../../application/use-cases/export-resource.use-case";

@ObjectType()
export class ExportResourceResponseDto {
  static fromOutput(output: ExportResourceOutput): ExportResourceResponseDto {
    const dto = new ExportResourceResponseDto();
    dto.filename = output.filename;
    dto.mimeType = output.mimeType;
    dto.base64 = output.base64;
    return dto;
  }

  @Field()
  filename!: string;

  @Field()
  mimeType!: string;

  @Field()
  base64!: string;
}
