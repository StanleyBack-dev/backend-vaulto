import {
  escapeHtml,
  renderStandardEmailLayout,
} from "../layout/standard-email-layout.template";
import { EMAIL_BRAND } from "../layout/email-brand";

interface SupportMessageConfirmationEmailTemplateInput {
  name: string;
  categoryLabel: string;
  message: string;
}

export function buildSupportMessageConfirmationEmail({
  name,
  categoryLabel,
  message,
}: SupportMessageConfirmationEmailTemplateInput): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = name.split(" ")[0] || name;

  const text = [
    `Olá, ${firstName}.`,
    "",
    "Recebemos sua mensagem de suporte e nossa equipe vai analisá-la em breve.",
    "",
    `Categoria: ${categoryLabel}`,
    "Sua mensagem:",
    message,
  ].join("\n");

  const html = renderStandardEmailLayout({
    title: "Recebemos sua mensagem",
    preheader: "Nossa equipe vai analisar sua mensagem em breve.",
    heading: "Recebemos sua mensagem!",
    greeting: `Olá, ${firstName}!`,
    contentHtml: `
      <p style="margin:0 0 14px 0;color:${EMAIL_BRAND.textMuted};">
        Recebemos sua mensagem de suporte (categoria <strong>${escapeHtml(categoryLabel)}</strong>) e nossa equipe vai analisá-la em breve.
      </p>
      <p style="margin:0;color:${EMAIL_BRAND.textMuted};">
        <strong>Sua mensagem:</strong><br />
        ${escapeHtml(message).replace(/\n/g, "<br />")}
      </p>
    `,
    footerNote: "E-mail automático — não é necessário responder.",
  });

  return {
    subject: "Recebemos sua mensagem de suporte",
    html,
    text,
  };
}
