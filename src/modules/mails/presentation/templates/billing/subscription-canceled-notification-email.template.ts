import {
  escapeHtml,
  renderStandardEmailLayout,
} from "../layout/standard-email-layout.template";
import { EMAIL_BRAND } from "../layout/email-brand";

interface SubscriptionCanceledNotificationEmailTemplateInput {
  userName: string;
  userEmail: string;
  reasonLabels: string[];
  otherReason?: string;
  billingCycleLabel: string;
  activeDurationLabel: string;
  requestedAtLabel: string;
  effectiveCancellationAtLabel: string;
}

function renderRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:6px 12px 6px 0;color:${EMAIL_BRAND.textSoft};white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:6px 0;color:${EMAIL_BRAND.text};font-weight:600;">${value}</td>
    </tr>
  `;
}

export function buildSubscriptionCanceledNotificationEmail({
  userName,
  userEmail,
  reasonLabels,
  otherReason,
  billingCycleLabel,
  activeDurationLabel,
  requestedAtLabel,
  effectiveCancellationAtLabel,
}: SubscriptionCanceledNotificationEmailTemplateInput): {
  subject: string;
  html: string;
  text: string;
} {
  const reasonsText = reasonLabels.join(", ");

  const text = [
    "Um usuário cancelou a assinatura Vaulto Pro.",
    "",
    `Usuário: ${userName} <${userEmail}>`,
    `Ciclo de cobrança: ${billingCycleLabel}`,
    `Tempo de plano ativo: ${activeDurationLabel}`,
    `Solicitado em: ${requestedAtLabel}`,
    `Cancelamento efetivo em: ${effectiveCancellationAtLabel}`,
    `Motivos: ${reasonsText}`,
    otherReason ? `Comentário do usuário: ${otherReason}` : undefined,
  ]
    .filter(Boolean)
    .join("\n");

  const rows = [
    renderRow("Usuário", `${escapeHtml(userName)} (${escapeHtml(userEmail)})`),
    renderRow("Ciclo de cobrança", escapeHtml(billingCycleLabel)),
    renderRow("Tempo de plano ativo", escapeHtml(activeDurationLabel)),
    renderRow("Solicitado em", escapeHtml(requestedAtLabel)),
    renderRow(
      "Cancelamento efetivo em",
      escapeHtml(effectiveCancellationAtLabel),
    ),
    renderRow("Motivos informados", escapeHtml(reasonsText)),
  ].join("");

  const html = renderStandardEmailLayout({
    title: "Assinatura cancelada",
    preheader: `${userName} cancelou a assinatura Vaulto Pro.`,
    heading: "Assinatura Vaulto Pro cancelada",
    greeting: "Notificação interna",
    contentHtml: `
      <p style="margin:0 0 16px 0;color:${EMAIL_BRAND.textMuted};">
        Um usuário concluiu a pesquisa de cancelamento e sua assinatura foi cancelada.
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${rows}
      </table>
      ${
        otherReason
          ? `<p style="margin:16px 0 0 0;color:${EMAIL_BRAND.textMuted};">
               <strong>Comentário do usuário:</strong> ${escapeHtml(otherReason)}
             </p>`
          : ""
      }
    `,
    footerNote: "E-mail automático — não é necessário responder.",
  });

  return {
    subject: `Cancelamento de assinatura — ${userName}`,
    html,
    text,
  };
}
