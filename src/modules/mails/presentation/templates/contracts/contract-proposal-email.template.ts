import { renderStandardEmailLayout } from "../layout/standard-email-layout.template";
import { EMAIL_BRAND } from "../layout/email-brand";

interface ContractProposalTemplateInput {
  leadName: string;
  contractNumber: string;
  budgetNumber: string;
  issueDate: string;
  validUntil?: string;
  displacementFee?: number;
  totalAmount?: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function buildPlainText(input: ContractProposalTemplateInput): string {
  const lines: string[] = [
    `Olá, ${input.leadName}.`,
    "",
    `Segue o contrato ${input.contractNumber} referente ao orçamento ${input.budgetNumber}.`,
    "",
    `Data de emissão: ${formatDate(input.issueDate)}`,
  ];

  if (input.validUntil) {
    lines.push(`Validade: ${formatDate(input.validUntil)}`);
  }

  lines.push(
    `Taxa de deslocamento: ${formatCurrency(input.displacementFee ?? 0)}`,
  );

  if (typeof input.totalAmount === "number") {
    lines.push(`Valor total: ${formatCurrency(input.totalAmount)}`);
  }

  lines.push(
    "",
    "Este e-mail é uma prévia do contrato.",
    input.displacementFee && input.displacementFee > 0
      ? `O valor total do contrato contempla a taxa de deslocamento de ${formatCurrency(input.displacementFee)}.`
      : "O valor total do contrato segue as condições previstas no orçamento aprovado.",
    "Se estiver de acordo, a Royal enviará o link de assinatura online por e-mail.",
    "",
    "Em caso de dúvidas, entre em contato conosco.",
    "Atenciosamente, Royal Copeiras",
  );

  return lines.join("\n");
}

export function buildContractProposalEmail(
  input: ContractProposalTemplateInput,
): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = input.leadName.split(" ")[0] || input.leadName;

  const contentHtml = `
    <p style="margin:0 0 14px 0;color:${EMAIL_BRAND.textMuted};">Segue o contrato em anexo para sua análise prévia.</p>
    <div style="background:${EMAIL_BRAND.cardBackground};border:1px solid ${EMAIL_BRAND.border};border-radius:10px;padding:14px 16px;margin:0 0 16px 0;">
      <p style="margin:0 0 6px 0;font-size:14px;color:${EMAIL_BRAND.text};"><strong style="color:${EMAIL_BRAND.accentDark};">Contrato:</strong> ${input.contractNumber}</p>
      <p style="margin:0 0 6px 0;font-size:14px;color:${EMAIL_BRAND.text};"><strong style="color:${EMAIL_BRAND.accentDark};">Orçamento:</strong> ${input.budgetNumber}</p>
      <p style="margin:0 0 6px 0;font-size:14px;color:${EMAIL_BRAND.text};"><strong style="color:${EMAIL_BRAND.accentDark};">Data de emissão:</strong> ${formatDate(input.issueDate)}</p>
      ${input.validUntil ? `<p style="margin:0 0 6px 0;font-size:14px;color:${EMAIL_BRAND.text};"><strong style="color:${EMAIL_BRAND.accentDark};">Válido até:</strong> ${formatDate(input.validUntil)}</p>` : ""}
      <p style="margin:0 0 6px 0;font-size:14px;color:${EMAIL_BRAND.text};"><strong style="color:${EMAIL_BRAND.accentDark};">Taxa de deslocamento:</strong> ${formatCurrency(input.displacementFee ?? 0)}</p>
      ${typeof input.totalAmount === "number" ? `<p style="margin:0 0 6px 0;font-size:14px;color:${EMAIL_BRAND.text};"><strong style="color:${EMAIL_BRAND.accentDark};">Valor total:</strong> ${formatCurrency(input.totalAmount)}</p>` : ""}
    </div>
    <p style="margin:0 0 12px 0;font-size:14px;color:${EMAIL_BRAND.textMuted};">
      Este e-mail é uma <strong>prévia do contrato</strong>.
      ${input.displacementFee && input.displacementFee > 0 ? ` O valor total contempla a taxa de deslocamento de <strong>${formatCurrency(input.displacementFee)}</strong>.` : ""}
      Se estiver de acordo, a Royal enviará o link de assinatura online por e-mail.
    </p>
    <p style="margin:20px 0 0 0;font-size:14px;color:${EMAIL_BRAND.textMuted};">Em caso de dúvidas, entre em contato conosco. Teremos prazer em atendê-lo(a).</p>
  `;

  const html = renderStandardEmailLayout({
    title: `Contrato ${input.contractNumber}`,
    preheader: `Contrato ${input.contractNumber} - Royal Copeiras`,
    heading: "Prévia de contrato",
    greeting: `Olá, ${firstName}!`,
    contentHtml,
    footerNote:
      "Você recebeu este contrato porque seu contato está cadastrado em nosso sistema. Para mais informações, responda este e-mail.",
  });

  return {
    subject: `Contrato ${input.contractNumber} - Royal Copeiras`,
    html,
    text: buildPlainText(input),
  };
}
