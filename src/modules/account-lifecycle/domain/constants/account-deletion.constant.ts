// Grace period the user has to change their mind after requesting account
// deletion. The account stays fully usable during this window; the daily
// account-deletions job only processes requests past this deadline.
export const ACCOUNT_DELETION_GRACE_PERIOD_DAYS = 30;
