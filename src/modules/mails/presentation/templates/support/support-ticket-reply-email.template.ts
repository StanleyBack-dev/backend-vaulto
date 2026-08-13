import {
  escapeHtml,
  renderStandardEmailLayout,
} from "../layout/standard-email-layout.template";
import { EMAIL_BRAND } from "../layout/email-brand";

interface SupportTicketReplyEmailTemplateInput {
  name: string;
  protocolLabel: string;
  categoryLabel: string;
  originalMessage: string;
  reply: string;
}

export function buildSupportTicketReplyEmail({
  name,
  protocolLabel,
  categoryLabel,
  originalMessage,
  reply,
}: SupportTicketReplyEmailTemplateInput): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = name.split(" ")[0] || name;

  const text = [
    `Olá, ${firstName}.`,
    "",
    `Nossa equipe respondeu o seu chamado de suporte ${protocolLabel} (categoria ${categoryLabel}).`,
    "",
    "Sua mensagem original:",
    originalMessage,
    "",
    "Nossa resposta:",
    reply,
  ].join("\n");

  const html = renderStandardEmailLayout({
    title: `Resposta ao chamado ${protocolLabel}`,
    preheader: "Nossa equipe respondeu o seu chamado de suporte.",
    heading: "Respondemos o seu chamado!",
    greeting: `Olá, ${firstName}!`,
    contentHtml: `
      <p style="margin:0 0 14px 0;color:${EMAIL_BRAND.textMuted};">
        Nossa equipe respondeu o seu chamado de suporte <strong>${escapeHtml(protocolLabel)}</strong> (categoria <strong>${escapeHtml(categoryLabel)}</strong>).
      </p>
      <p style="margin:0 0 14px 0;color:${EMAIL_BRAND.textMuted};">
        <strong>Sua mensagem original:</strong><br />
        ${escapeHtml(originalMessage).replace(/\n/g, "<br />")}
      </p>
      <p style="margin:0;color:${EMAIL_BRAND.text};">
        <strong>Nossa resposta:</strong><br />
        ${escapeHtml(reply).replace(/\n/g, "<br />")}
      </p>
    `,
    footerNote:
      "Se precisar de mais alguma coisa, envie uma nova mensagem pelo canal de suporte.",
  });

  return {
    subject: `Resposta ao seu chamado de suporte ${protocolLabel}`,
    html,
    text,
  };
}
