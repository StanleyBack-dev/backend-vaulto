import { renderStandardEmailLayout } from "../layout/standard-email-layout.template";
import { EMAIL_BRAND } from "../layout/email-brand";

interface PaymentOverdueEmailTemplateInput {
  appUrl: string;
  graceDays: number;
  name: string;
}

export function buildPaymentOverdueEmail({
  appUrl,
  graceDays,
  name,
}: PaymentOverdueEmailTemplateInput): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = name.split(" ")[0] || name;
  const graceDaysLabel = graceDays === 1 ? "1 dia" : `${graceDays} dias`;

  const text = [
    `Olá, ${firstName}.`,
    "",
    "Não conseguimos confirmar o pagamento da sua assinatura Vaulto Pro.",
    "Se você pagou por Pix ou Boleto, verifique se o pagamento foi concluído. Caso tenha usado cartão, confira se há limite disponível.",
    `Você tem ${graceDaysLabel} para regularizar antes que sua conta volte ao plano Free.`,
    "",
    `Acesse: ${appUrl}/perfil`,
  ].join("\n");

  const html = renderStandardEmailLayout({
    title: "Pagamento não identificado",
    preheader: "Não conseguimos confirmar o pagamento da sua assinatura.",
    heading: "Pagamento não identificado",
    greeting: `Olá, ${firstName}!`,
    contentHtml: `
      <p style="margin:0 0 14px 0;color:${EMAIL_BRAND.textMuted};">
        Não conseguimos confirmar o pagamento da sua assinatura <strong>Vaulto Pro</strong>.
      </p>
      <p style="margin:0 0 14px 0;color:${EMAIL_BRAND.textMuted};">
        Se você pagou por Pix ou Boleto, verifique se o pagamento foi concluído. Caso tenha usado cartão, confira se há limite disponível.
      </p>
      <p style="margin:0;color:${EMAIL_BRAND.textMuted};">
        Você tem <strong>${graceDaysLabel}</strong> para regularizar antes que sua conta volte automaticamente ao plano Free.
      </p>
    `,
    ctaLabel: "Ver minha assinatura",
    ctaUrl: `${appUrl}/perfil`,
    logoUrl: `${appUrl.replace(/\/$/, "")}/vaulto-logo-96.png`,
    footerNote: "Se você já regularizou o pagamento, pode ignorar este aviso.",
  });

  return {
    subject: "Pagamento não identificado na sua assinatura Vaulto Pro",
    html,
    text,
  };
}
