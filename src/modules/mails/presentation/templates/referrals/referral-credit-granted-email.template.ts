import { renderStandardEmailLayout } from "../layout/standard-email-layout.template";
import { EMAIL_BRAND } from "../layout/email-brand";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

interface ReferralCreditGrantedEmailTemplateInput {
  appUrl: string;
  name: string;
  amountCents: number;
  holdDays: number;
}

export function buildReferralCreditGrantedEmail({
  appUrl,
  name,
  amountCents,
  holdDays,
}: ReferralCreditGrantedEmailTemplateInput): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = name.split(" ")[0] || name;
  const amountLabel = currencyFormatter.format(amountCents / 100);

  const text = [
    `Olá, ${firstName}.`,
    "",
    `Boa notícia! Um amigo que você indicou assinou o Vaulto Pro, e você acabou de ganhar ${amountLabel} de crédito.`,
    `Esse valor fica disponível pra saque em ${holdDays} dias. Continue indicando pra acumular e sacar via Pix quando quiser.`,
    "",
    `Acesse: ${appUrl}`,
  ].join("\n");

  const html = renderStandardEmailLayout({
    title: `Você ganhou ${amountLabel} de crédito de indicação`,
    preheader: `Um amigo indicado assinou o Pro — seu crédito já está na sua carteira.`,
    heading: "Você ganhou um crédito!",
    greeting: `Olá, ${firstName}!`,
    contentHtml: `
      <p style="margin:0 0 14px 0;color:${EMAIL_BRAND.textMuted};">
        Boa notícia! Um amigo que você indicou assinou o Vaulto Pro, e você acabou de ganhar <strong>${amountLabel}</strong> de crédito.
      </p>
      <p style="margin:0;color:${EMAIL_BRAND.textMuted};">
        Esse valor fica disponível pra saque em <strong>${holdDays} dias</strong>. Continue indicando pra acumular e sacar via Pix quando quiser.
      </p>
    `,
    ctaLabel: "Ver minha carteira de indicações",
    ctaUrl: appUrl,
    logoUrl: `${appUrl.replace(/\/$/, "")}/vaulto-logo-96.png`,
    footerNote: "Continue indicando amigos para ganhar cada vez mais.",
  });

  return {
    subject: `Você ganhou ${amountLabel} de crédito de indicação!`,
    html,
    text,
  };
}
