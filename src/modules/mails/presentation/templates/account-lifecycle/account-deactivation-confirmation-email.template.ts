import { renderStandardEmailLayout } from "../layout/standard-email-layout.template";
import { EMAIL_BRAND } from "../layout/email-brand";

interface AccountDeactivationConfirmationEmailTemplateInput {
  appUrl: string;
  name: string;
}

export function buildAccountDeactivationConfirmationEmail({
  appUrl,
  name,
}: AccountDeactivationConfirmationEmailTemplateInput): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = name.split(" ")[0] || name;

  const text = [
    `Olá, ${firstName}.`,
    "",
    "Sua conta na Vaulto foi inativada, conforme solicitado.",
    "Seus dados continuam guardados com segurança. Quando quiser voltar, é só fazer login normalmente: sua conta será reativada automaticamente.",
    "",
    `Acesse: ${appUrl}`,
  ].join("\n");

  const html = renderStandardEmailLayout({
    title: "Sua conta foi inativada",
    preheader: "Sua conta na Vaulto foi inativada.",
    heading: "Conta inativada",
    greeting: `Olá, ${firstName}!`,
    contentHtml: `
      <p style="margin:0 0 14px 0;color:${EMAIL_BRAND.textMuted};">
        Sua conta na Vaulto foi inativada, conforme solicitado.
      </p>
      <p style="margin:0;color:${EMAIL_BRAND.textMuted};">
        Seus dados continuam guardados com segurança. Quando quiser voltar, é só fazer login normalmente: sua conta será <strong>reativada automaticamente</strong>.
      </p>
    `,
    logoUrl: `${appUrl.replace(/\/$/, "")}/vaulto-logo-96.png`,
    footerNote:
      "Se você não reconhece esta ação, entre em contato com o suporte.",
  });

  return {
    subject: "Sua conta na Vaulto foi inativada",
    html,
    text,
  };
}
