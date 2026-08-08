import { renderStandardEmailLayout } from "../layout/standard-email-layout.template";
import { EMAIL_BRAND } from "../layout/email-brand";

interface SubscriptionTrialEndingEmailTemplateInput {
  appUrl: string;
  name: string;
  trialEndsAt: Date;
}

function formatTrialEndsAt(trialEndsAt: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(
    trialEndsAt,
  );
}

export function buildSubscriptionTrialEndingEmail({
  appUrl,
  name,
  trialEndsAt,
}: SubscriptionTrialEndingEmailTemplateInput): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = name.split(" ")[0] || name;
  const formattedDate = formatTrialEndsAt(trialEndsAt);

  const text = [
    `Olá, ${firstName}.`,
    "",
    `Seu período de teste do Vaulto Pro termina em ${formattedDate}.`,
    "Garanta que a forma de pagamento escolhida (Pix, Boleto ou Cartão) esteja em dia para continuar com acesso ilimitado sem interrupção.",
    "",
    `Acesse: ${appUrl}/perfil`,
  ].join("\n");

  const html = renderStandardEmailLayout({
    title: "Seu trial do Vaulto Pro termina amanhã",
    preheader: `Seu período de teste termina em ${formattedDate}.`,
    heading: "Seu trial termina em breve",
    greeting: `Olá, ${firstName}!`,
    contentHtml: `
      <p style="margin:0 0 14px 0;color:${EMAIL_BRAND.textMuted};">
        Seu período de teste do <strong>Vaulto Pro</strong> termina em <strong>${formattedDate}</strong>.
      </p>
      <p style="margin:0;color:${EMAIL_BRAND.textMuted};">
        Garanta que a forma de pagamento escolhida (Pix, Boleto ou Cartão) esteja em dia para continuar com dívidas, cartões e receitas ilimitados sem interrupção.
      </p>
    `,
    ctaLabel: "Ver minha assinatura",
    ctaUrl: `${appUrl}/perfil`,
    logoUrl: `${appUrl.replace(/\/$/, "")}/vaulto-logo-96.png`,
    footerNote:
      "Se você já regularizou o pagamento, pode ignorar este lembrete.",
  });

  return {
    subject: "Seu trial do Vaulto Pro termina amanhã",
    html,
    text,
  };
}
