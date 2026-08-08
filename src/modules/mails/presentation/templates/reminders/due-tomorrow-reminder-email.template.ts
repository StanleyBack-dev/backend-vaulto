import { formatCurrencyBRL } from "@/utils/pdf/format-currency.util";
import {
  escapeHtml,
  renderStandardEmailLayout,
} from "../layout/standard-email-layout.template";
import { EMAIL_BRAND } from "../layout/email-brand";

export interface DueTomorrowReminderItem {
  title: string;
  amountDue: number;
}

interface DueTomorrowReminderEmailTemplateInput {
  appUrl: string;
  name: string;
  debts: DueTomorrowReminderItem[];
  incomes: DueTomorrowReminderItem[];
}

function sumAmounts(items: DueTomorrowReminderItem[]): number {
  return items.reduce((sum, item) => sum + item.amountDue, 0);
}

function buildListText(items: DueTomorrowReminderItem[]): string {
  return items
    .map((item) => `- ${item.title}: ${formatCurrencyBRL(item.amountDue)}`)
    .join("\n");
}

function buildListHtml(items: DueTomorrowReminderItem[]): string {
  return items
    .map(
      (item) => `
      <tr>
        <td style="padding:6px 0;color:${EMAIL_BRAND.text};">${escapeHtml(item.title)}</td>
        <td style="padding:6px 0;text-align:right;color:${EMAIL_BRAND.text};font-weight:700;white-space:nowrap;">${formatCurrencyBRL(item.amountDue)}</td>
      </tr>
    `,
    )
    .join("");
}

export function buildDueTomorrowReminderEmail({
  appUrl,
  name,
  debts,
  incomes,
}: DueTomorrowReminderEmailTemplateInput): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = name.split(" ")[0] || name;
  const totalDebts = sumAmounts(debts);
  const totalIncomes = sumAmounts(incomes);

  const text = [
    `Olá, ${firstName}.`,
    "",
    "Você tem vencimentos para amanhã no Vaulto:",
    ...(debts.length > 0
      ? ["", `Dívidas a pagar (${formatCurrencyBRL(totalDebts)}):`, buildListText(debts)]
      : []),
    ...(incomes.length > 0
      ? [
          "",
          `Receitas a receber (${formatCurrencyBRL(totalIncomes)}):`,
          buildListText(incomes),
        ]
      : []),
    "",
    `Acesse: ${appUrl}/lembretes`,
  ].join("\n");

  const debtsHtml =
    debts.length > 0
      ? `
      <p style="margin:18px 0 6px 0;font-weight:700;color:${EMAIL_BRAND.text};">
        Dívidas a pagar — total ${formatCurrencyBRL(totalDebts)}
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid ${EMAIL_BRAND.border};">
        ${buildListHtml(debts)}
      </table>
    `
      : "";

  const incomesHtml =
    incomes.length > 0
      ? `
      <p style="margin:18px 0 6px 0;font-weight:700;color:${EMAIL_BRAND.text};">
        Receitas a receber — total ${formatCurrencyBRL(totalIncomes)}
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid ${EMAIL_BRAND.border};">
        ${buildListHtml(incomes)}
      </table>
    `
      : "";

  const html = renderStandardEmailLayout({
    title: "Vencimentos de amanhã",
    preheader: "Você tem dívidas ou receitas vencendo amanhã.",
    heading: "Vencimentos de amanhã",
    greeting: `Olá, ${firstName}!`,
    contentHtml: `
      <p style="margin:0;color:${EMAIL_BRAND.textMuted};">
        Este é o seu lembrete diário do Vaulto Pro: confira o que vence amanhã.
      </p>
      ${debtsHtml}
      ${incomesHtml}
    `,
    ctaLabel: "Ver meus lembretes",
    ctaUrl: `${appUrl}/lembretes`,
    logoUrl: `${appUrl.replace(/\/$/, "")}/vaulto-logo-96.png`,
    footerNote:
      "Você recebe este e-mail diariamente por ser assinante do Vaulto Pro.",
  });

  return {
    subject: "Vencimentos de amanhã no Vaulto",
    html,
    text,
  };
}
