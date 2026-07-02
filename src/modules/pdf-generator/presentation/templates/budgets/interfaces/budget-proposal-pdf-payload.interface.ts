export interface BudgetProposalPdfPayloadDetail {
  label: string;
  value: string;
}

export interface BudgetProposalPdfPayloadItem {
  description: string;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
  notes?: string;
}

export interface BudgetProposalPdfPayloadFooter {
  cityAndIssueDate: string;
  validity: string;
  reservationPolicy: string;
  convenienceMessage: string;
  paymentMethods: string;
}

export interface BudgetProposalPdfPayload {
  companyName: string;
  companySubtitle: string;
  documentTitle: string;
  documentSubtitle: string;
  logoPlaceholderLabel: string;
  itemsSectionTitle: string;
  introductionParagraphs: string[];
  metadata: BudgetProposalPdfPayloadDetail[];
  eventDetails: BudgetProposalPdfPayloadDetail[];
  items: BudgetProposalPdfPayloadItem[];
  notes: string[];
  totals: {
    subtotal: string;
    displacementFee: string;
    discountLabel?: string;
    discountAmount?: string;
    total: string;
  };
  footer: BudgetProposalPdfPayloadFooter;
  referenceCode: string;
}
