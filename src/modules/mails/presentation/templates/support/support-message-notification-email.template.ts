import {
  escapeHtml,
  renderStandardEmailLayout,
} from "../layout/standard-email-layout.template";
import { EMAIL_BRAND } from "../layout/email-brand";

interface SupportMessageNotificationEmailTemplateInput {
  userName: string;
  userEmail: string;
  categoryLabel: string;
  message: string;
  sentAtLabel: string;
}

function renderRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:6px 12px 6px 0;color:${EMAIL_BRAND.textSoft};white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:6px 0;color:${EMAIL_BRAND.text};font-weight:600;">${value}</td>
    </tr>
  `;
}

export function buildSupportMessageNotificationEmail({
  userName,
  userEmail,
  categoryLabel,
  message,
  sentAtLabel,
}: SupportMessageNotificationEmailTemplateInput): {
  subject: string;
  html: string;
  text: string;
} {
  const text = [
    "Um usuário enviou uma mensagem de suporte pelo Vaulto.",
    "",
    `Usuário: ${userName} <${userEmail}>`,
    `Categoria: ${categoryLabel}`,
    `Enviado em: ${sentAtLabel}`,
    "",
    "Mensagem:",
    message,
  ].join("\n");

  const rows = [
    renderRow("Usuário", `${escapeHtml(userName)} (${escapeHtml(userEmail)})`),
    renderRow("Categoria", escapeHtml(categoryLabel)),
    renderRow("Enviado em", escapeHtml(sentAtLabel)),
  ].join("");

  const html = renderStandardEmailLayout({
    title: "Nova mensagem de suporte",
    preheader: `${userName} enviou uma mensagem de suporte (${categoryLabel}).`,
    heading: "Nova mensagem de suporte",
    greeting: "Notificação interna",
    contentHtml: `
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${rows}
      </table>
      <p style="margin:16px 0 0 0;color:${EMAIL_BRAND.textMuted};">
        <strong>Mensagem:</strong><br />
        ${escapeHtml(message).replace(/\n/g, "<br />")}
      </p>
    `,
    footerNote: "E-mail automático — não é necessário responder.",
  });

  return {
    subject: `Suporte — ${categoryLabel} — ${userName}`,
    html,
    text,
  };
}
