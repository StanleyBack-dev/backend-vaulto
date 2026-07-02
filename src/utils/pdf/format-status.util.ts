const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  generated: "Gerado",
  sent: "Enviado",
  approved: "Aprovado",
  rejected: "Rejeitado",
  expired: "Expirado",
  canceled: "Cancelado",
};

export function formatStatus(status: string): string {
  return STATUS_LABELS[status] ?? status;
}
