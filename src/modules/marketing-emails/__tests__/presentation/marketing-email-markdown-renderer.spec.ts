import { renderMarketingEmailBodyHtml } from "@/modules/marketing-emails/presentation/templates/marketing-email-markdown-renderer";

describe("renderMarketingEmailBodyHtml", () => {
  it("renders headings, bold text and links with brand styling", () => {
    const html = renderMarketingEmailBodyHtml(
      "## Título\n\nUm **texto em negrito** com [um link](https://vaulto.app.br).",
    );

    expect(html).toContain("<h2");
    expect(html).toContain("<strong");
    expect(html).toContain('href="https://vaulto.app.br"');
    expect(html).toContain('target="_blank"');
  });

  it("renders a GFM table with header and rows", () => {
    const html = renderMarketingEmailBodyHtml(
      "| Plano | Preço |\n| --- | ---: |\n| Pro | R$ 29,90 |",
    );

    expect(html).toContain("<table");
    expect(html).toContain("<th");
    expect(html).toContain("Plano");
    expect(html).toContain("R$ 29,90");
  });

  it("strips tags outside the allow-list (e.g. script) as defense-in-depth", () => {
    const html = renderMarketingEmailBodyHtml(
      'Olá <script>alert("x")</script> mundo',
    );

    expect(html).not.toContain("<script");
    expect(html).not.toContain("alert(");
  });
});
