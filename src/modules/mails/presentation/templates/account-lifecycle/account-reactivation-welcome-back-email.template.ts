import { renderStandardEmailLayout } from "../layout/standard-email-layout.template";
import { EMAIL_BRAND } from "../layout/email-brand";

interface AccountReactivationWelcomeBackEmailTemplateInput {
  appUrl: string;
  name: string;
}

export function buildAccountReactivationWelcomeBackEmail({
  appUrl,
  name,
}: AccountReactivationWelcomeBackEmailTemplateInput): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = name.split(" ")[0] || name;

  const text = [
    `Olá, ${firstName}.`,
    "",
    "Que bom ter você de volta! Sua conta na Vaulto foi reativada automaticamente e todos os seus dados estão exatamente como você deixou.",
    "",
    `Acesse: ${appUrl}`,
  ].join("\n");

  const html = renderStandardEmailLayout({
    title: "Bem-vindo(a) de volta à Vaulto",
    preheader: "Sua conta foi reativada automaticamente.",
    heading: "Bem-vindo(a) de volta!",
    greeting: `Olá, ${firstName}!`,
    contentHtml: `
      <p style="margin:0;color:${EMAIL_BRAND.textMuted};">
        Que bom ter você de volta! Sua conta na Vaulto foi <strong>reativada automaticamente</strong> e todos os seus dados estão exatamente como você deixou.
      </p>
    `,
    ctaLabel: "Acessar minha conta",
    ctaUrl: appUrl,
    logoUrl: `${appUrl.replace(/\/$/, "")}/vaulto-logo-96.png`,
    footerNote:
      "Se você não reconhece este login, troque sua senha imediatamente.",
  });

  return {
    subject: "Bem-vindo(a) de volta à Vaulto!",
    html,
    text,
  };
}
