import { registerEnumType } from "@nestjs/graphql";
import { ExportFormat } from "@/modules/exports/domain/enums/export-format.enum";
import { ExportResource } from "@/modules/exports/domain/enums/export-resource.enum";
import { StatementScope } from "@/modules/exports/domain/enums/statement-scope.enum";

registerEnumType(ExportResource, {
  name: "ExportResource",
});

registerEnumType(ExportFormat, {
  name: "ExportFormat",
});

registerEnumType(StatementScope, {
  name: "StatementScope",
});
