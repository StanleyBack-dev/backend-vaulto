import { formatCurrencyBRL } from "@/utils/pdf";
import type { CreditCardView } from "@/modules/credit-cards/application/ports/credit-card-repository.port";
import { CreditCardsExportBuilder } from "../../application/builders/credit-cards-export.builder";

function cardView(overrides: Partial<CreditCardView> = {}): CreditCardView {
  return {
    idCreditCard: "card-1",
    idUsers: "user-1",
    name: "Nubank",
    creditLimit: 5000,
    dueDay: 10,
    closingDay: 3,
    status: true,
    usedLimit: 1200,
    availableLimit: 3800,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("CreditCardsExportBuilder", () => {
  it("builds rows with used/available limits and status label", async () => {
    const creditCardRepository = {
      listByUser: jest.fn().mockResolvedValue({
        records: [
          cardView(),
          cardView({ idCreditCard: "card-2", status: false }),
        ],
        total: 2,
      }),
    };
    const builder = new CreditCardsExportBuilder(creditCardRepository as never);

    const payload = await builder.build("user-1", "Stanley", {});

    expect(payload.rows[0]).toEqual([
      "Nubank",
      formatCurrencyBRL(5000),
      formatCurrencyBRL(1200),
      formatCurrencyBRL(3800),
      "3",
      "10",
      "Ativo",
    ]);
    expect(payload.rows[1][6]).toBe("Inativo");
    expect(payload.totals).toEqual([
      { label: "Limite total", value: formatCurrencyBRL(10000) },
      { label: "Limite usado total", value: formatCurrencyBRL(2400) },
    ]);
  });

  it("forwards the active/inactive filter applied on screen", async () => {
    const creditCardRepository = {
      listByUser: jest.fn().mockResolvedValue({ records: [], total: 0 }),
    };
    const builder = new CreditCardsExportBuilder(creditCardRepository as never);

    await builder.build("user-1", "Stanley", { activeOnly: false });

    expect(creditCardRepository.listByUser).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ status: false }),
    );
  });
});
