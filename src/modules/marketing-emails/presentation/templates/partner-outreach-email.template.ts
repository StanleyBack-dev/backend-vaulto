import { renderStandardEmailLayout } from "@/modules/mails/presentation/templates/layout/standard-email-layout.template";
import { renderMarketingEmailBodyHtml } from "@/modules/marketing-emails/presentation/templates/marketing-email-markdown-renderer";
import {
  buildCommissionMarkdownTable,
  formatPartnershipPercentageLabel,
  resolvePartnershipPercentage,
} from "@/modules/marketing-emails/presentation/templates/partnership-commission";

interface PartnerOutreachEmailTemplateInput {
  appUrl: string;
  subject: string;
  bodyMarkdown: string;
  recipientName?: string;
  partnershipPercentage?: number;
}

const NAME_PLACEHOLDER_PATTERN = /\{\{\s*nome\s*\}\}/gi;
const PERCENTAGE_PLACEHOLDER_PATTERN = /\{\{\s*percentual\s*\}\}/gi;
const COMMISSION_TABLE_PLACEHOLDER_PATTERN = /\{\{\s*tabela_comissao\s*\}\}/gi;

// Lets the default template's greeting ("Olá, {{nome}}!") personalize itself
// with whatever the admin typed in the recipient name field — same
// substitution for the live preview and the real send, so what the admin
// sees is exactly what goes out. Falls back to dropping the ", {{nome}}"
// bit entirely (not just an empty name) so the greeting still reads well
// before the admin has typed a name yet.
function applyRecipientNamePlaceholder(
  bodyMarkdown: string,
  recipientName?: string,
): string {
  const firstName = recipientName?.trim().split(" ")[0];

  if (firstName) {
    return bodyMarkdown.replace(NAME_PLACEHOLDER_PATTERN, firstName);
  }

  return bodyMarkdown
    .replace(/,\s*\{\{\s*nome\s*\}\}/gi, "")
    .replace(NAME_PLACEHOLDER_PATTERN, "");
}

// Lets the default template's "{{percentual}}%" and "{{tabela_comissao}}"
// placeholders recompute from the single percentage the admin sets, instead
// of the prose and the illustrative table drifting out of sync with each
// other when the deal terms change.
function applyPartnershipPercentagePlaceholders(
  bodyMarkdown: string,
  partnershipPercentage?: number,
): string {
  const percentage = resolvePartnershipPercentage(partnershipPercentage);

  return bodyMarkdown
    .replace(
      PERCENTAGE_PLACEHOLDER_PATTERN,
      formatPartnershipPercentageLabel(percentage),
    )
    .replace(
      COMMISSION_TABLE_PLACEHOLDER_PATTERN,
      buildCommissionMarkdownTable(percentage),
    );
}

// Shared by both the real send (SendMarketingEmailUseCase) and the live
// preview (PreviewMarketingEmailUseCase) so the admin always previews
// exactly what goes out — same renderer, same layout, same HTML.
export function buildPartnerOutreachEmail({
  appUrl,
  subject,
  bodyMarkdown,
  recipientName,
  partnershipPercentage,
}: PartnerOutreachEmailTemplateInput): {
  subject: string;
  html: string;
  text: string;
} {
  const bodyWithName = applyRecipientNamePlaceholder(
    bodyMarkdown,
    recipientName,
  );
  const personalizedBodyMarkdown = applyPartnershipPercentagePlaceholders(
    bodyWithName,
    partnershipPercentage,
  );
  const contentHtml = renderMarketingEmailBodyHtml(personalizedBodyMarkdown);

  const html = renderStandardEmailLayout({
    title: subject,
    preheader: "Uma proposta de parceria da equipe Vaulto para você.",
    heading: "Proposta de Parceria",
    greeting: "",
    contentHtml,
    logoUrl: `${appUrl.replace(/\/$/, "")}/vaulto-logo-96.png`,
    footerNote:
      "Este e-mail foi enviado pela equipe Vaulto para apresentar uma proposta de parceria. Se você não esperava este contato, pode ignorá-lo.",
  });

  return {
    subject,
    html,
    text: personalizedBodyMarkdown,
  };
}
