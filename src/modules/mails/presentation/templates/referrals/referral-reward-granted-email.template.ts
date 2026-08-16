import { renderStandardEmailLayout } from "../layout/standard-email-layout.template";
import { EMAIL_BRAND } from "../layout/email-brand";

interface ReferralRewardGrantedEmailTemplateInput {
  appUrl: string;
  name: string;
  appliedImmediately: boolean;
}

export function buildReferralRewardGrantedEmail({
  appUrl,
  name,
  appliedImmediately,
}: ReferralRewardGrantedEmailTemplateInput): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = name.split(" ")[0] || name;
  const explanation = appliedImmediately
    ? "Já ativamos os 30 dias extras de Vaulto Pro na sua conta."
    : "Como você já é assinante Pro, esse mês entra automaticamente assim que o seu ciclo atual terminar — nenhuma cobrança a mais nesse período.";

  const text = [
    `Olá, ${firstName}.`,
    "",
    "Parabéns! 3 amigos que você indicou assinaram o Vaulto Pro, e você acabou de ganhar 1 mês grátis de Pro.",
    explanation,
    "",
    `Acesse: ${appUrl}`,
  ].join("\n");

  const html = renderStandardEmailLayout({
    title: "Você ganhou 1 mês grátis de Vaulto Pro",
    preheader:
      "3 amigos indicados assinaram o Pro — seu mês grátis já está garantido.",
    heading: "Você ganhou 1 mês grátis!",
    greeting: `Olá, ${firstName}!`,
    contentHtml: `
      <p style="margin:0 0 14px 0;color:${EMAIL_BRAND.textMuted};">
        Parabéns! <strong>3 amigos</strong> que você indicou assinaram o Vaulto Pro, e você acabou de ganhar <strong>1 mês grátis de Pro</strong>.
      </p>
      <p style="margin:0;color:${EMAIL_BRAND.textMuted};">
        ${explanation}
      </p>
    `,
    ctaLabel: "Acessar minha conta",
    ctaUrl: appUrl,
    logoUrl: `${appUrl.replace(/\/$/, "")}/vaulto-logo-96.png`,
    footerNote: "Continue indicando amigos para ganhar cada vez mais.",
  });

  return {
    subject: "Você ganhou 1 mês grátis de Vaulto Pro!",
    html,
    text,
  };
}
