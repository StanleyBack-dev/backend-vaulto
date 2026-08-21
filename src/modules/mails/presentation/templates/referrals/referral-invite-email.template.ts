import { renderStandardEmailLayout } from "../layout/standard-email-layout.template";
import { EMAIL_BRAND } from "../layout/email-brand";

interface ReferralInviteEmailTemplateInput {
  appUrl: string;
  referrerName: string;
  referralCode: string;
}

export function buildReferralInviteEmail({
  appUrl,
  referrerName,
  referralCode,
}: ReferralInviteEmailTemplateInput): {
  subject: string;
  html: string;
  text: string;
} {
  const referrerFirstName = referrerName.split(" ")[0] || referrerName;
  const referralLink = `${appUrl.replace(/\/$/, "")}/?ref=${referralCode}`;

  const text = [
    `${referrerFirstName} te indicou pro Vaulto!`,
    "",
    "O Vaulto é um app de controle financeiro pessoal — dívidas, receitas, cartões e metas, tudo num só lugar.",
    `Assine o Pro com o código de indicação abaixo e ${referrerFirstName} ganha uma recompensa:`,
    "",
    `Código: ${referralCode}`,
    `Acesse: ${referralLink}`,
  ].join("\n");

  const html = renderStandardEmailLayout({
    title: `${referrerFirstName} te indicou pro Vaulto`,
    preheader: `${referrerFirstName} usa o Vaulto pra organizar as finanças e quer te indicar.`,
    heading: "Você recebeu um convite!",
    greeting: `Olá!`,
    contentHtml: `
      <p style="margin:0 0 14px 0;color:${EMAIL_BRAND.textMuted};">
        <strong>${referrerFirstName}</strong> te indicou pro Vaulto — um app de controle financeiro pessoal pra organizar dívidas, receitas, cartões e metas num só lugar.
      </p>
      <p style="margin:0;color:${EMAIL_BRAND.textMuted};">
        Use o código <strong>${referralCode}</strong> ao assinar o Pro pelo link abaixo.
      </p>
    `,
    ctaLabel: "Conhecer o Vaulto",
    ctaUrl: referralLink,
    logoUrl: `${appUrl.replace(/\/$/, "")}/vaulto-logo-96.png`,
    footerNote:
      "Se você não conhece essa pessoa ou não esperava esse convite, pode ignorar este email.",
  });

  return {
    subject: `${referrerFirstName} te indicou pro Vaulto`,
    html,
    text,
  };
}
