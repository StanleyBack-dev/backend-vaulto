import { Marked, type RendererObject, type Tokens } from "marked";
import sanitizeHtml from "sanitize-html";
import { escapeHtml } from "@/modules/mails/presentation/templates/layout/standard-email-layout.template";
import { EMAIL_BRAND } from "@/modules/mails/presentation/templates/layout/email-brand";

// Admin-authored markdown (the partner outreach text, freely editable) needs
// to render with the same visual identity as the rest of the product's
// e-mails instead of marked's bare default tags, and the preview query must
// produce byte-for-byte the same HTML as the actual send — so both go
// through this single renderer. Plain object (not a Renderer subclass):
// marked copies these functions onto its own internal renderer instance and
// calls them with that instance as `this`, so `this.parser` resolves
// correctly for parsing nested inline tokens (bold, links, ...).
function buildRenderer(): RendererObject {
  return {
    heading({ tokens, depth }: Tokens.Heading): string {
      const text = this.parser.parseInline(tokens);
      const fontSize = depth <= 2 ? "19px" : "16px";

      return `<h${depth} style="margin:22px 0 10px 0;font-size:${fontSize};line-height:1.35;color:${EMAIL_BRAND.text};">${text}</h${depth}>`;
    },

    paragraph({ tokens }: Tokens.Paragraph): string {
      return `<p style="margin:0 0 14px 0;">${this.parser.parseInline(tokens)}</p>`;
    },

    strong({ tokens }: Tokens.Strong): string {
      return `<strong style="color:${EMAIL_BRAND.text};">${this.parser.parseInline(tokens)}</strong>`;
    },

    link({ href, title, tokens }: Tokens.Link): string {
      const text = this.parser.parseInline(tokens);
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";

      return `<a href="${escapeHtml(href)}"${titleAttr} target="_blank" rel="noopener noreferrer" style="color:${EMAIL_BRAND.accentDark};font-weight:700;">${text}</a>`;
    },

    hr(): string {
      return `<hr style="border:none;border-top:1px solid ${EMAIL_BRAND.border};margin:20px 0;" />`;
    },

    list(token: Tokens.List): string {
      const tag = token.ordered ? "ol" : "ul";
      const items = token.items.map((item) => this.listitem(item)).join("");

      return `<${tag} style="margin:0 0 14px 0;padding-left:22px;">${items}</${tag}>`;
    },

    listitem(item: Tokens.ListItem): string {
      return `<li style="margin:0 0 6px 0;">${this.parser.parseInline(item.tokens)}</li>`;
    },

    table(token: Tokens.Table): string {
      const headerCells = token.header
        .map((cell, index) => {
          const align = token.align[index] ?? "left";
          return `<th style="padding:10px 12px;text-align:${align};background:${EMAIL_BRAND.headerBackground};color:${EMAIL_BRAND.white};font-size:12px;">${this.parser.parseInline(cell.tokens)}</th>`;
        })
        .join("");

      const bodyRows = token.rows
        .map((row) => {
          const cells = row
            .map((cell, index) => {
              const align = token.align[index] ?? "left";
              return `<td style="padding:9px 12px;text-align:${align};border-bottom:1px solid ${EMAIL_BRAND.border};font-size:13px;color:${EMAIL_BRAND.textMuted};">${this.parser.parseInline(cell.tokens)}</td>`;
            })
            .join("");
          return `<tr>${cells}</tr>`;
        })
        .join("");

      return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:12px 0 18px 0;border:1px solid ${EMAIL_BRAND.border};border-radius:8px;overflow:hidden;"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
    },
  };
}

const marketingMarked = new Marked({
  renderer: buildRenderer(),
  gfm: true,
  breaks: false,
});

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "h1",
    "h2",
    "h3",
    "h4",
    "p",
    "strong",
    "em",
    "a",
    "ul",
    "ol",
    "li",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "hr",
    "br",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel", "style"],
    "*": ["style"],
  },
  allowedSchemes: ["http", "https", "mailto"],
};

// bodyMarkdown -> sanitized, brand-styled HTML fragment (no <html>/<body>
// wrapper — this is meant to be dropped into renderStandardEmailLayout's
// contentHtml slot). Synchronous: no async marked extensions are registered.
export function renderMarketingEmailBodyHtml(bodyMarkdown: string): string {
  const rawHtml = marketingMarked.parse(bodyMarkdown, {
    async: false,
  }) as string;

  return sanitizeHtml(rawHtml, SANITIZE_OPTIONS);
}
