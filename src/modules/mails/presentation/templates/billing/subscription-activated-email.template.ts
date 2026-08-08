import { renderStandardEmailLayout } from "../layout/standard-email-layout.template";
import { EMAIL_BRAND } from "../layout/email-brand";

interface SubscriptionActivatedEmailTemplateInput {
  appUrl: string;
  name: string;
}

export function buildSubscriptionActivatedEmail({
  appUrl,
  name,
}: SubscriptionActivatedEmailTemplateInput): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = name.split(" ")[0] || name;

  const text = [
    `Olá, ${firstName}.`,
    "",
    "Seu Vaulto Pro está ativo! O pagamento da sua assinatura foi confirmado.",
    "Agora você tem dívidas, cartões e receitas ilimitados, histórico completo, filtros e relatórios avançados.",
    "",
    `Acesse: ${appUrl}`,
  ].join("\n");

  const html = renderStandardEmailLayout({
    title: "Seu Vaulto Pro está ativo",
    preheader: "O pagamento da sua assinatura foi confirmado.",
    heading: "Seu Vaulto Pro começou!",
    greeting: `Olá, ${firstName}!`,
    contentHtml: `
      <p style="margin:0 0 14px 0;color:${EMAIL_BRAND.textMuted};">
        O pagamento da sua assinatura foi confirmado e o <strong>Vaulto Pro</strong> já está ativo na sua conta.
      </p>
      <p style="margin:0;color:${EMAIL_BRAND.textMuted};">
        Agora você tem dívidas, cartões e receitas ilimitados, histórico completo, filtros avançados e relatórios comparativos.
      </p>
    `,
    ctaLabel: "Explorar o Vaulto Pro",
    ctaUrl: appUrl,
    logoUrl: `${appUrl.replace(/\/$/, "")}/vaulto-logo-96.png`,
    footerNote: "Obrigado por assinar o Vaulto Pro.",
  });

  return {
    subject: "Seu Vaulto Pro começou!",
    html,
    text,
  };
}
