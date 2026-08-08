import { RemindersController } from "@/modules/reminders/presentation/rest/controllers/reminders.controller";

function buildController() {
  const sendDueTomorrowRemindersUseCase = {
    execute: jest.fn().mockResolvedValue({ remindersSent: 3 }),
  };

  const controller = new RemindersController(
    sendDueTomorrowRemindersUseCase as never,
  );

  return { controller, sendDueTomorrowRemindersUseCase };
}

describe("RemindersController", () => {
  it("runs the send due-tomorrow reminders use case", async () => {
    const { controller, sendDueTomorrowRemindersUseCase } = buildController();

    const result = await controller.run();

    expect(sendDueTomorrowRemindersUseCase.execute).toHaveBeenCalled();
    expect(result).toEqual({ remindersSent: 3 });
  });
});
