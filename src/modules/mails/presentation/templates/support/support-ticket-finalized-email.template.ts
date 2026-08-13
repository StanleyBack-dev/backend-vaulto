import {
  escapeHtml,
  renderStandardEmailLayout,
} from "../layout/standard-email-layout.template";
import { EMAIL_BRAND } from "../layout/email-brand";

interface SupportTicketFinalizedEmailTemplateInput {
  name: string;
  protocolLabel: string;
  categoryLabel: string;
  adminReply?: string;
}

export function buildSupportTicketFinalizedEmail({
  name,
  protocolLabel,
  categoryLabel,
  adminReply,
}: SupportTicketFinalizedEmailTemplateInput): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = name.split(" ")[0] || name;

  const text = [
    `Olá, ${firstName}.`,
    "",
    `Seu chamado de suporte ${protocolLabel} (categoria ${categoryLabel}) foi finalizado.`,
    ...(adminReply ? ["", "Última resposta da nossa equipe:", adminReply] : []),
    "",
    "Se precisar de algo mais, é só abrir um novo chamado pelo canal de suporte.",
  ].join("\n");

  const html = renderStandardEmailLayout({
    title: `Chamado ${protocolLabel} finalizado`,
    preheader: "Seu chamado de suporte foi finalizado.",
    heading: "Chamado finalizado",
    greeting: `Olá, ${firstName}!`,
    contentHtml: `
      <p style="margin:0 0 14px 0;color:${EMAIL_BRAND.textMuted};">
        Seu chamado de suporte <strong>${escapeHtml(protocolLabel)}</strong> (categoria <strong>${escapeHtml(categoryLabel)}</strong>) foi finalizado pela nossa equipe.
      </p>
      ${
        adminReply
          ? `<p style="margin:0 0 14px 0;color:${EMAIL_BRAND.text};">
        <strong>Última resposta da nossa equipe:</strong><br />
        ${escapeHtml(adminReply).replace(/\n/g, "<br />")}
      </p>`
          : ""
      }
      <p style="margin:0;color:${EMAIL_BRAND.textMuted};">
        Se precisar de algo mais, é só abrir um novo chamado pelo canal de suporte.
      </p>
    `,
    footerNote: "E-mail automático — não é necessário responder.",
  });

  return {
    subject: `Chamado de suporte ${protocolLabel} finalizado`,
    html,
    text,
  };
}
