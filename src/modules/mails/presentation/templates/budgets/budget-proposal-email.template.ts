import { renderStandardEmailLayout } from "../layout/standard-email-layout.template";
import { EMAIL_BRAND } from "../layout/email-brand";

interface BudgetProposalItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

interface BudgetProposalTemplateInput {
  leadName: string;
  budgetNumber: string;
  issueDate: string;
  validUntil: string;
  eventLocation?: string;
  eventDates?: string[];
  guestCount?: number;
  durationHours?: number;
  advancePercentage?: number;
  discountType?: "percentage" | "amount" | null;
  discountPercentage?: number | null;
  discountAmount?: number | null;
  displacementFee?: number;
  subtotal: number;
  totalAmount: number;
  items: BudgetProposalItem[];
}

const FIXED_BUDGET_NOTE =
  "Os valores apresentados consideram as taxas e encargos informados na proposta.";
const FIXED_PAYMENT_METHOD = "Pix ou transferência bancária.";

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function extractServiceTypes(items: BudgetProposalItem[]): string[] {
  const labels = [
    { key: "garcom", label: "Garçom" },
    { key: "copeira", label: "Copeira" },
    { key: "porteiro", label: "Porteiro" },
    { key: "seguranca", label: "Segurança" },
  ] as const;

  const found = new Set<string>();

  for (const item of items) {
    const description = normalizeText(item.description);
    for (const entry of labels) {
      if (description.includes(entry.key)) {
        found.add(entry.label);
      }
    }
  }

  return Array.from(found);
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

function resolveDiscount(input: BudgetProposalTemplateInput): {
  label?: string;
  amount: number;
} {
  if (input.discountType === "percentage") {
    const percentage = Number(input.discountPercentage ?? 0);
    if (!Number.isFinite(percentage) || percentage <= 0) {
      return { amount: 0 };
    }

    const baseTotal =
      Number(input.subtotal ?? 0) + Number(input.displacementFee ?? 0);
    const amount = Number((baseTotal * (percentage / 100)).toFixed(2));

    return {
      label: `Desconto (${percentage}%)`,
      amount,
    };
  }

  if (input.discountType === "amount") {
    const amount = Number(input.discountAmount ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return { amount: 0 };
    }

    return {
      label: "Desconto (Valor Fixo)",
      amount: Number(amount.toFixed(2)),
    };
  }

  return { amount: 0 };
}

function buildItemsTable(items: BudgetProposalItem[]): string {
  const rows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 10px;border-bottom:1px solid ${EMAIL_BRAND.border};font-size:14px;color:${EMAIL_BRAND.text};">${item.description}</td>
        <td style="padding:8px 10px;border-bottom:1px solid ${EMAIL_BRAND.border};font-size:14px;color:${EMAIL_BRAND.text};text-align:center;">${item.quantity}</td>
        <td style="padding:8px 10px;border-bottom:1px solid ${EMAIL_BRAND.border};font-size:14px;color:${EMAIL_BRAND.text};text-align:right;">${formatCurrency(item.unitPrice)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid ${EMAIL_BRAND.border};font-size:14px;color:${EMAIL_BRAND.text};text-align:right;"><strong>${formatCurrency(item.totalPrice)}</strong></td>
      </tr>
      ${item.notes ? `<tr><td colspan="4" style="padding:2px 10px 8px 10px;font-size:12px;color:${EMAIL_BRAND.textSoft};border-bottom:1px solid ${EMAIL_BRAND.border};">Obs: ${item.notes}</td></tr>` : ""}
    `,
    )
    .join("");

  return `
    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid ${EMAIL_BRAND.border};border-radius:8px;overflow:hidden;margin:16px 0;">
      <thead>
        <tr style="background:${EMAIL_BRAND.cardBackground};">
          <th style="padding:8px 10px;text-align:left;font-size:12px;font-weight:700;color:${EMAIL_BRAND.textMuted};text-transform:uppercase;letter-spacing:.5px;">Descrição</th>
          <th style="padding:8px 10px;text-align:center;font-size:12px;font-weight:700;color:${EMAIL_BRAND.textMuted};text-transform:uppercase;letter-spacing:.5px;">Qtd</th>
          <th style="padding:8px 10px;text-align:right;font-size:12px;font-weight:700;color:${EMAIL_BRAND.textMuted};text-transform:uppercase;letter-spacing:.5px;">Valor Unit.</th>
          <th style="padding:8px 10px;text-align:right;font-size:12px;font-weight:700;color:${EMAIL_BRAND.textMuted};text-transform:uppercase;letter-spacing:.5px;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function buildDetailRow(label: string, value: string): string {
  return `<p style="margin:0 0 6px 0;font-size:14px;color:${EMAIL_BRAND.text};"><strong style="color:${EMAIL_BRAND.accentDark};">${label}:</strong> ${value}</p>`;
}

function buildPlainText(input: BudgetProposalTemplateInput): string {
  const discount = resolveDiscount(input);
  const serviceTypes = extractServiceTypes(input.items);
  const serviceTypesText = serviceTypes.length
    ? `Tipos de serviço previstos: ${serviceTypes.join(", ")}.`
    : "Tipos de serviço previstos conforme proposta enviada.";

  const lines: string[] = [
    `Olá, ${input.leadName}.`,
    "",
    `Segue a proposta comercial referente ao orçamento ${input.budgetNumber}.`,
    "",
    `Data de emissão: ${formatDate(input.issueDate)}`,
    `Validade: ${formatDate(input.validUntil)}`,
  ];

  if (input.eventLocation) {
    lines.push(`Local do evento: ${input.eventLocation}`);
  }
  if (input.eventDates?.length) {
    lines.push(
      `Datas do evento: ${input.eventDates.map(formatDate).join(", ")}`,
    );
  }
  if (input.guestCount) {
    lines.push(`Número de convidados: ${input.guestCount}`);
  }
  if (input.durationHours) {
    lines.push(`Duração: ${input.durationHours}h`);
  }
  lines.push(`Forma de pagamento: ${FIXED_PAYMENT_METHOD}`);
  if (input.advancePercentage !== undefined) {
    lines.push(`Entrada: ${input.advancePercentage}%`);
  }
  lines.push(
    `Taxa de deslocamento: ${formatCurrency(input.displacementFee ?? 0)}`,
  );
  if (discount.label && discount.amount > 0) {
    lines.push(`${discount.label}: -${formatCurrency(discount.amount)}`);
  }

  lines.push("", "Itens:");
  input.items.forEach((item) => {
    lines.push(
      `  - ${item.description} | Qtd: ${item.quantity} | Unit.: ${formatCurrency(item.unitPrice)} | Total: ${formatCurrency(item.totalPrice)}`,
    );
    if (item.notes) {
      lines.push(`    Obs: ${item.notes}`);
    }
  });

  lines.push("", `Subtotal: ${formatCurrency(input.subtotal)}`);
  lines.push(
    `Taxa de deslocamento: ${formatCurrency(input.displacementFee ?? 0)}`,
  );
  if (discount.label && discount.amount > 0) {
    lines.push(`${discount.label}: -${formatCurrency(discount.amount)}`);
  }
  lines.push(`Total: ${formatCurrency(input.totalAmount)}`);

  lines.push("", FIXED_BUDGET_NOTE);
  lines.push(serviceTypesText);

  lines.push(
    "",
    "Em caso de dúvidas, entre em contato conosco.",
    "Atenciosamente, Royal Copeiras",
  );

  return lines.join("\n");
}

export function buildBudgetProposalEmail(input: BudgetProposalTemplateInput): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = input.leadName.split(" ")[0] || input.leadName;
  const discount = resolveDiscount(input);

  const detailsHtml = [
    buildDetailRow("Número do orçamento", input.budgetNumber),
    buildDetailRow("Data de emissão", formatDate(input.issueDate)),
    buildDetailRow("Válido até", formatDate(input.validUntil)),
    input.eventLocation
      ? buildDetailRow("Local do evento", input.eventLocation)
      : "",
    input.eventDates?.length
      ? buildDetailRow(
          "Datas do evento",
          input.eventDates.map(formatDate).join(", "),
        )
      : "",
    input.guestCount
      ? buildDetailRow("Convidados", String(input.guestCount))
      : "",
    input.durationHours
      ? buildDetailRow("Duração", `${input.durationHours}h`)
      : "",
    buildDetailRow("Forma de pagamento", FIXED_PAYMENT_METHOD),
    input.advancePercentage !== undefined
      ? buildDetailRow("Entrada", `${input.advancePercentage}%`)
      : "",
    discount.label && discount.amount > 0
      ? buildDetailRow(discount.label, `- ${formatCurrency(discount.amount)}`)
      : "",
    buildDetailRow(
      "Taxa de deslocamento",
      formatCurrency(input.displacementFee ?? 0),
    ),
  ]
    .filter(Boolean)
    .join("");

  const totalsHtml = `
    <table width="100%" cellspacing="0" cellpadding="0" style="margin-top:8px;">
      <tr>
        <td style="font-size:14px;color:${EMAIL_BRAND.text};">Subtotal</td>
        <td style="font-size:14px;color:${EMAIL_BRAND.text};text-align:right;">${formatCurrency(input.subtotal)}</td>
      </tr>
      <tr>
        <td style="font-size:14px;color:${EMAIL_BRAND.text};padding-top:6px;">Taxa de deslocamento</td>
        <td style="font-size:14px;color:${EMAIL_BRAND.text};text-align:right;padding-top:6px;">${formatCurrency(input.displacementFee ?? 0)}</td>
      </tr>
      ${
        discount.label && discount.amount > 0
          ? `
      <tr>
        <td style="font-size:14px;color:${EMAIL_BRAND.text};padding-top:6px;">${discount.label}</td>
        <td style="font-size:14px;color:#b91c1c;text-align:right;padding-top:6px;">-${formatCurrency(discount.amount)}</td>
      </tr>
      `
          : ""
      }
      <tr>
        <td style="font-size:16px;font-weight:700;color:${EMAIL_BRAND.text};padding-top:6px;">Total</td>
        <td style="font-size:16px;font-weight:700;color:${EMAIL_BRAND.text};text-align:right;padding-top:6px;">${formatCurrency(input.totalAmount)}</td>
      </tr>
    </table>
  `;
  const serviceTypes = extractServiceTypes(input.items);
  const serviceTypesText = serviceTypes.length
    ? `Tipos de serviço previstos: ${serviceTypes.join(", ")}.`
    : "Tipos de serviço previstos conforme proposta enviada.";

  const notesHtml = `<div style="margin-top:14px;padding:12px 14px;background:${EMAIL_BRAND.cardBackground};border:1px solid ${EMAIL_BRAND.border};border-radius:8px;font-size:13px;color:${EMAIL_BRAND.text};"><strong style="color:${EMAIL_BRAND.accentDark};">Informações importantes:</strong><br>${FIXED_BUDGET_NOTE}<br>${serviceTypesText}</div>`;

  const contentHtml = `
    <p style="margin:0 0 14px 0;color:${EMAIL_BRAND.textMuted};">Segue a proposta comercial preparada especialmente para você.</p>
    <div style="background:${EMAIL_BRAND.cardBackground};border:1px solid ${EMAIL_BRAND.border};border-radius:10px;padding:14px 16px;margin:0 0 16px 0;">
      ${detailsHtml}
    </div>
    ${buildItemsTable(input.items)}
    ${totalsHtml}
    ${notesHtml}
    <p style="margin:20px 0 0 0;font-size:14px;color:${EMAIL_BRAND.textMuted};">Em caso de dúvidas, entre em contato conosco. Teremos prazer em atendê-lo(a).</p>
  `;

  const html = renderStandardEmailLayout({
    title: `Proposta Comercial - ${input.budgetNumber}`,
    preheader: `Orçamento ${input.budgetNumber} - Royal Copeiras`,
    heading: "Proposta Comercial",
    greeting: `Olá, ${firstName}!`,
    contentHtml,
    footerNote:
      "Você recebeu esta proposta porque seu contato está cadastrado em nosso sistema. Para mais informações, responda este e-mail.",
  });

  return {
    subject: `Proposta Comercial ${input.budgetNumber} - Royal Copeiras`,
    html,
    text: buildPlainText(input),
  };
}
