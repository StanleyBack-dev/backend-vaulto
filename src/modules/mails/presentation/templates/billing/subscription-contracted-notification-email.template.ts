import {
  escapeHtml,
  renderStandardEmailLayout,
} from "../layout/standard-email-layout.template";
import { EMAIL_BRAND } from "../layout/email-brand";

interface SubscriptionContractedNotificationEmailTemplateInput {
  userName: string;
  userEmail: string;
  billingCycleLabel: string;
  priceLabel: string;
  confirmedAtLabel: string;
}

function renderRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:6px 12px 6px 0;color:${EMAIL_BRAND.textSoft};white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:6px 0;color:${EMAIL_BRAND.text};font-weight:600;">${value}</td>
    </tr>
  `;
}

export function buildSubscriptionContractedNotificationEmail({
  userName,
  userEmail,
  billingCycleLabel,
  priceLabel,
  confirmedAtLabel,
}: SubscriptionContractedNotificationEmailTemplateInput): {
  subject: string;
  html: string;
  text: string;
} {
  const text = [
    "Um usuário assinou o Vaulto Pro e o primeiro pagamento foi confirmado.",
    "",
    `Usuário: ${userName} <${userEmail}>`,
    `Ciclo de cobrança: ${billingCycleLabel}`,
    `Valor: ${priceLabel}`,
    `Pagamento confirmado em: ${confirmedAtLabel}`,
  ].join("\n");

  const rows = [
    renderRow("Usuário", `${escapeHtml(userName)} (${escapeHtml(userEmail)})`),
    renderRow("Ciclo de cobrança", escapeHtml(billingCycleLabel)),
    renderRow("Valor", escapeHtml(priceLabel)),
    renderRow("Pagamento confirmado em", escapeHtml(confirmedAtLabel)),
  ].join("");

  const html = renderStandardEmailLayout({
    title: "Nova assinatura Vaulto Pro",
    preheader: `${userName} assinou o Vaulto Pro.`,
    heading: "Nova assinatura Vaulto Pro confirmada",
    greeting: "Notificação interna",
    contentHtml: `
      <p style="margin:0 0 16px 0;color:${EMAIL_BRAND.textMuted};">
        O primeiro pagamento de uma nova assinatura Vaulto Pro foi confirmado.
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${rows}
      </table>
    `,
    footerNote: "E-mail automático — não é necessário responder.",
  });

  return {
    subject: `Nova assinatura Vaulto Pro — ${userName}`,
    html,
    text,
  };
}
