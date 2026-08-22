// Powers the default template's {{percentual}} / {{tabela_comissao}}
// placeholders: the admin sets one number (the partnership's commission
// rate) and both the prose and the illustrative table recompute from it,
// instead of the old hardcoded "20%" text that drifted out of sync with the
// table whenever the deal terms changed.
export const DEFAULT_PARTNERSHIP_PERCENTAGE = 20;

const COMMISSION_TABLE_SUBSCRIBER_TIERS = [10, 25, 50, 100, 250, 500, 1000];
const FIRST_MONTH_PRICE_BRL = 19.9;
const RECURRING_PRICE_BRL = 29.9;

function formatIntegerBR(value: number): string {
  return value.toLocaleString("pt-BR");
}

function formatCurrencyBRL(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPartnershipPercentageLabel(percentage: number): string {
  return percentage.toString().replace(".", ",");
}

export function resolvePartnershipPercentage(percentage?: number): number {
  return typeof percentage === "number" && !Number.isNaN(percentage)
    ? percentage
    : DEFAULT_PARTNERSHIP_PERCENTAGE;
}

export function buildCommissionMarkdownTable(percentage: number): string {
  const rate = percentage / 100;
  const header =
    "| Novos assinantes | Comissão no 1º mês | Comissão mensal após o 1º mês |";
  const separator =
    "| ---------------- | -----------------: | ----------------------------: |";
  const rows = COMMISSION_TABLE_SUBSCRIBER_TIERS.map((tier) => {
    const firstMonthCommission = tier * FIRST_MONTH_PRICE_BRL * rate;
    const recurringCommission = tier * RECURRING_PRICE_BRL * rate;

    return `| ${formatIntegerBR(tier)} usuários | ${formatCurrencyBRL(firstMonthCommission)} | ${formatCurrencyBRL(recurringCommission)} |`;
  });

  return [header, separator, ...rows].join("\n");
}
