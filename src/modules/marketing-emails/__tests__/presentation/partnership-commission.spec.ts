import {
  buildCommissionMarkdownTable,
  formatPartnershipPercentageLabel,
  resolvePartnershipPercentage,
} from "@/modules/marketing-emails/presentation/templates/partnership-commission";

describe("partnership-commission", () => {
  it("defaults to 20% when no percentage is given", () => {
    expect(resolvePartnershipPercentage(undefined)).toBe(20);
    expect(resolvePartnershipPercentage(Number.NaN)).toBe(20);
  });

  it("keeps a given percentage as-is", () => {
    expect(resolvePartnershipPercentage(15)).toBe(15);
  });

  it("formats the percentage label using a comma for decimals", () => {
    expect(formatPartnershipPercentageLabel(20)).toBe("20");
    expect(formatPartnershipPercentageLabel(12.5)).toBe("12,5");
  });

  it("recomputes every row of the commission table from the given percentage", () => {
    const table = buildCommissionMarkdownTable(10);

    expect(table).toContain("| 10 usuários | R$ 19,90 | R$ 29,90 |");
    expect(table).toContain("| 1.000 usuários | R$ 1.990,00 | R$ 2.990,00 |");
  });

  it("matches the original hardcoded 20% table", () => {
    const table = buildCommissionMarkdownTable(20);

    expect(table).toContain("| 10 usuários | R$ 39,80 | R$ 59,80 |");
    expect(table).toContain("| 25 usuários | R$ 99,50 | R$ 149,50 |");
    expect(table).toContain("| 1.000 usuários | R$ 3.980,00 | R$ 5.980,00 |");
  });
});
