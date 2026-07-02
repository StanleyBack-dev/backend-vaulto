function parsePdfDate(value: string | Date): Date {
  if (value instanceof Date) {
    return value;
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, year, month, day] = match;
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
  }

  return new Date(value);
}

export function formatDateBR(value: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR").format(parsePdfDate(value));
}
