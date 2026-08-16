import { renderStandardEmailLayout } from "../layout/standard-email-layout.template";
import { EMAIL_BRAND } from "../layout/email-brand";

interface AccountDeletionRequestedEmailTemplateInput {
  appUrl: string;
  name: string;
  scheduledFor: Date;
}

function formatScheduledFor(scheduledFor: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(
    scheduledFor,
  );
}

export function buildAccountDeletionRequestedEmail({
  appUrl,
  name,
  scheduledFor,
}: AccountDeletionRequestedEmailTemplateInput): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = name.split(" ")[0] || name;
  const formattedDate = formatScheduledFor(scheduledFor);

  const text = [
    `Olá, ${firstName}.`,
    "",
    "Recebemos sua solicitação de exclusão de conta na Vaulto.",
    `Seus dados serão apagados permanentemente em ${formattedDate}, caso você não cancele antes.`,
    "Até lá, sua conta continua funcionando normalmente. Para desistir, basta entrar na sua conta e cancelar a solicitação na tela de Perfil.",
    "",
    `Acesse: ${appUrl}/perfil`,
  ].join("\n");

  const html = renderStandardEmailLayout({
    title: "Solicitação de exclusão de conta recebida",
    preheader: `Seus dados serão apagados em ${formattedDate}, caso você não cancele antes.`,
    heading: "Solicitação de exclusão recebida",
    greeting: `Olá, ${firstName}!`,
    contentHtml: `
      <p style="margin:0 0 14px 0;color:${EMAIL_BRAND.textMuted};">
        Recebemos sua solicitação de exclusão de conta na Vaulto.
      </p>
      <p style="margin:0 0 14px 0;color:${EMAIL_BRAND.textMuted};">
        Seus dados serão apagados permanentemente em <strong>${formattedDate}</strong>, caso você não cancele antes.
      </p>
      <p style="margin:0;color:${EMAIL_BRAND.textMuted};">
        Até lá, sua conta continua funcionando normalmente. Para desistir, basta entrar na sua conta e cancelar a solicitação na tela de Perfil.
      </p>
    `,
    ctaLabel: "Ir para o meu Perfil",
    ctaUrl: `${appUrl}/perfil`,
    logoUrl: `${appUrl.replace(/\/$/, "")}/vaulto-logo-96.png`,
    footerNote:
      "Se você não reconhece esta solicitação, entre em contato com o suporte imediatamente.",
  });

  return {
    subject: "Sua conta na Vaulto será excluída — confira o prazo",
    html,
    text,
  };
}
