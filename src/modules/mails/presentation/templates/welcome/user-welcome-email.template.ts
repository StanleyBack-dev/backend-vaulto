import { renderStandardEmailLayout } from "../layout/standard-email-layout.template";
import { EMAIL_BRAND } from "../layout/email-brand";

interface UserWelcomeTemplateInput {
  name: string;
  email: string;
  appUrl: string;
}

function buildPlainTextContent({
  name,
  email,
  appUrl,
}: UserWelcomeTemplateInput): string {
  return [
    `Olá, ${name}.`,
    "",
    "Sua conta na Vaulto foi criada com sucesso usando o login do Google.",
    `E-mail: ${email}`,
    "",
    'Não é necessário definir uma senha: sempre que quiser entrar, use o botão "Entrar com Google" na tela de login.',
    `Acesse: ${appUrl}`,
  ].join("\n");
}

export function buildUserWelcomeEmail(input: UserWelcomeTemplateInput): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = input.name.split(" ")[0] || input.name;

  const contentHtml = `
    <p style="margin:0 0 12px 0;color:${EMAIL_BRAND.textMuted};">Sua conta na plataforma foi criada com sucesso usando o login do Google.</p>
    <div style="background:${EMAIL_BRAND.cardBackground};border:1px solid ${EMAIL_BRAND.border};border-radius:10px;padding:14px 16px;margin:8px 0 16px 0;">
      <p style="margin:0;color:${EMAIL_BRAND.text};"><strong style="color:${EMAIL_BRAND.accentDark};">E-mail:</strong> ${input.email}</p>
    </div>
    <p style="margin:0;color:${EMAIL_BRAND.textMuted};">Não é necessário definir uma senha: sempre que quiser entrar, use o botão "Entrar com Google" na tela de login.</p>
  `;

  const html = renderStandardEmailLayout({
    title: "Bem-vindo(a) à Vaulto",
    preheader: "Sua conta foi criada com sucesso via Google.",
    heading: "Bem-vindo(a) à Vaulto",
    greeting: `Olá, ${firstName}!`,
    contentHtml,
    ctaLabel: "Acessar plataforma",
    ctaUrl: input.appUrl,
    logoUrl: `${input.appUrl.replace(/\/$/, "")}/vaulto-logo-96.png`,
    footerNote: "Se você não reconhece este cadastro, ignore esta mensagem.",
  });

  return {
    subject: "Bem-vindo(a) à Vaulto",
    html,
    text: buildPlainTextContent(input),
  };
}
