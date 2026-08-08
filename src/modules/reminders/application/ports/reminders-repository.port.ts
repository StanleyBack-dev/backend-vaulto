export interface DueTomorrowItem {
  title: string;
  amountDue: number;
}

export interface DueTomorrowUserReminder {
  idUsers: string;
  name: string;
  email: string;
  debts: DueTomorrowItem[];
  incomes: DueTomorrowItem[];
}

export interface RemindersRepositoryPort {
  findProUsersWithDueTomorrow(
    dueDate: Date,
  ): Promise<DueTomorrowUserReminder[]>;
}

export const REMINDERS_REPOSITORY = Symbol("REMINDERS_REPOSITORY");
