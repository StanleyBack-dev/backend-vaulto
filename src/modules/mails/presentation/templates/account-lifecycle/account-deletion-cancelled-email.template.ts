import { renderStandardEmailLayout } from "../layout/standard-email-layout.template";
import { EMAIL_BRAND } from "../layout/email-brand";

interface AccountDeletionCancelledEmailTemplateInput {
  appUrl: string;
  name: string;
}

export function buildAccountDeletionCancelledEmail({
  appUrl,
  name,
}: AccountDeletionCancelledEmailTemplateInput): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = name.split(" ")[0] || name;

  const text = [
    `Olá, ${firstName}.`,
    "",
    "Sua solicitação de exclusão de conta foi cancelada. Seus dados continuam guardados com segurança e sua conta segue funcionando normalmente.",
    "",
    `Acesse: ${appUrl}`,
  ].join("\n");

  const html = renderStandardEmailLayout({
    title: "Exclusão de conta cancelada",
    preheader: "Sua conta na Vaulto continua ativa normalmente.",
    heading: "Exclusão cancelada",
    greeting: `Olá, ${firstName}!`,
    contentHtml: `
      <p style="margin:0;color:${EMAIL_BRAND.textMuted};">
        Sua solicitação de exclusão de conta foi cancelada. Seus dados continuam guardados com segurança e sua conta segue funcionando normalmente.
      </p>
    `,
    ctaLabel: "Acessar minha conta",
    ctaUrl: appUrl,
    logoUrl: `${appUrl.replace(/\/$/, "")}/vaulto-logo-96.png`,
    footerNote:
      "Se você não reconhece esta ação, entre em contato com o suporte.",
  });

  return {
    subject: "Exclusão da sua conta na Vaulto foi cancelada",
    html,
    text,
  };
}
