import { buildPartnerOutreachEmail } from "@/modules/marketing-emails/presentation/templates/partner-outreach-email.template";

describe("buildPartnerOutreachEmail", () => {
  it("personalizes the greeting with the recipient's first name", () => {
    const email = buildPartnerOutreachEmail({
      appUrl: "https://vaulto.app.br",
      subject: "Parceria",
      bodyMarkdown: "Olá, {{nome}}! Tudo bem?",
      recipientName: "Maria Silva",
    });

    expect(email.html).toContain("Olá, Maria! Tudo bem?");
    expect(email.text).toBe("Olá, Maria! Tudo bem?");
  });

  it("drops the placeholder gracefully when no recipient name is given", () => {
    const email = buildPartnerOutreachEmail({
      appUrl: "https://vaulto.app.br",
      subject: "Parceria",
      bodyMarkdown: "Olá, {{nome}}! Tudo bem?",
    });

    expect(email.html).toContain("Olá! Tudo bem?");
    expect(email.text).toBe("Olá! Tudo bem?");
  });
});
