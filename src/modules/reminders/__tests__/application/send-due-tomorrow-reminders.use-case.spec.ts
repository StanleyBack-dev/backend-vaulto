import { SendDueTomorrowRemindersUseCase } from "@/modules/reminders/application/use-cases/send-due-tomorrow-reminders.use-case";
import type { DueTomorrowUserReminder } from "@/modules/reminders/application/ports/reminders-repository.port";

function reminder(
  overrides: Partial<DueTomorrowUserReminder> = {},
): DueTomorrowUserReminder {
  return {
    idUsers: "user-1",
    name: "User One",
    email: "user1@example.com",
    debts: [{ title: "Cartão", amountDue: 100 }],
    incomes: [],
    ...overrides,
  };
}

function buildUseCase(
  overrides: { reminders?: DueTomorrowUserReminder[] } = {},
) {
  const remindersRepository = {
    findProUsersWithDueTomorrow: jest
      .fn()
      .mockResolvedValue(overrides.reminders ?? [reminder()]),
  };

  const dueTomorrowReminderEmailUseCase = {
    send: jest.fn().mockResolvedValue(undefined),
  };

  const useCase = new SendDueTomorrowRemindersUseCase(
    remindersRepository as never,
    dueTomorrowReminderEmailUseCase as never,
  );

  return { useCase, remindersRepository, dueTomorrowReminderEmailUseCase };
}

describe("SendDueTomorrowRemindersUseCase", () => {
  it("queries the repository for tomorrow's date", async () => {
    const { useCase, remindersRepository } = buildUseCase();

    await useCase.execute();

    const calledWith = remindersRepository.findProUsersWithDueTomorrow.mock
      .calls[0][0] as Date;
    const expectedTomorrow = new Date();
    expectedTomorrow.setDate(expectedTomorrow.getDate() + 1);

    expect(calledWith.toDateString()).toBe(expectedTomorrow.toDateString());
  });

  it("sends one summary email per user with debts and incomes due tomorrow", async () => {
    const twoReminders = [
      reminder({ idUsers: "user-1", email: "user1@example.com" }),
      reminder({
        idUsers: "user-2",
        email: "user2@example.com",
        debts: [],
        incomes: [{ title: "Salário", amountDue: 5000 }],
      }),
    ];
    const { useCase, dueTomorrowReminderEmailUseCase } = buildUseCase({
      reminders: twoReminders,
    });

    const result = await useCase.execute();

    expect(dueTomorrowReminderEmailUseCase.send).toHaveBeenCalledTimes(2);
    expect(dueTomorrowReminderEmailUseCase.send).toHaveBeenCalledWith({
      to: "user1@example.com",
      name: "User One",
      debts: [{ title: "Cartão", amountDue: 100 }],
      incomes: [],
    });
    expect(dueTomorrowReminderEmailUseCase.send).toHaveBeenCalledWith({
      to: "user2@example.com",
      name: "User One",
      debts: [],
      incomes: [{ title: "Salário", amountDue: 5000 }],
    });
    expect(result).toEqual({ remindersSent: 2 });
  });

  it("sends no emails and reports zero when nobody has a due-tomorrow item", async () => {
    const { useCase, dueTomorrowReminderEmailUseCase } = buildUseCase({
      reminders: [],
    });

    const result = await useCase.execute();

    expect(dueTomorrowReminderEmailUseCase.send).not.toHaveBeenCalled();
    expect(result).toEqual({ remindersSent: 0 });
  });
});
