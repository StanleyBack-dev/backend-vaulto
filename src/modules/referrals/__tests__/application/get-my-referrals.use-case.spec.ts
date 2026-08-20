import { GetMyReferralsUseCase } from "@/modules/referrals/application/use-cases/get-my-referrals.use-case";

describe("GetMyReferralsUseCase", () => {
  it("returns name, email and qualification date for each referred user", async () => {
    const referredUsers = [
      {
        name: "Amigo Qualificado",
        email: "qualificado@example.com",
        referralQualifiedAt: new Date("2026-08-01T00:00:00Z"),
      },
      {
        name: "Amigo Pendente",
        email: "pendente@example.com",
        referralQualifiedAt: null,
      },
    ];
    const userRepository = {
      find: jest.fn().mockResolvedValue(referredUsers),
    };

    const useCase = new GetMyReferralsUseCase(userRepository as never);

    const result = await useCase.execute("user-1");

    expect(userRepository.find).toHaveBeenCalledWith({
      where: { referredByUserId: "user-1" },
      order: { createdAt: "DESC" },
    });
    expect(result).toEqual([
      {
        name: "Amigo Qualificado",
        email: "qualificado@example.com",
        qualifiedAt: referredUsers[0].referralQualifiedAt,
      },
      {
        name: "Amigo Pendente",
        email: "pendente@example.com",
        qualifiedAt: null,
      },
    ]);
  });
});
