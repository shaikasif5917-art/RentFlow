import type { PaymentState } from "../data/types";

export type RentCollectionMethod = "prepaid" | "postpaid";

/**
 * Returns the current calendar billing month in "YYYY-MM-01" format
 * using local system time (safe from UTC midnight timezone shifts).
 */
export function getCurrentBillingMonth(asOf: Date = new Date()): string {
  const year = asOf.getFullYear();
  const month = String(asOf.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

/**
 * Parses a "YYYY-MM-DD" or "YYYY-MM" string into local year and month numbers.
 */
export function parseBillingMonth(billingMonth: string): { year: number; monthIndex: number } {
  const parts = billingMonth.split("-").map((p) => parseInt(p, 10));
  const year = parts[0] || new Date().getFullYear();
  const monthIndex = (parts[1] || 1) - 1; // 0-indexed month
  return { year, monthIndex };
}

/**
 * Calculates the exact end-of-day deadline (with grace period) for a given billing month.
 *
 * Rules:
 * - Prepaid: Rent is due according to the configured due day in the billing month.
 * - Postpaid: Rent is due according to the configured due day in the following month.
 * - Grace Period: Added in calendar days to the configured due day.
 * - Month boundaries: If due day exceeds the days in that month (e.g. Feb 30, Nov 31),
 *   it is clamped to the last day of that month before adding the grace period.
 */
export function getBillingDeadline(
  billingMonth: string,
  method: RentCollectionMethod = "prepaid",
  dueDay: number = 1,
  gracePeriodDays: number = 0,
): Date {
  const { year, monthIndex } = parseBillingMonth(billingMonth);

  let targetYear = year;
  let targetMonth = monthIndex;

  if (method === "postpaid") {
    targetMonth += 1;
    if (targetMonth > 11) {
      targetMonth = 0;
      targetYear += 1;
    }
  }

  // Find the exact number of days in the target month (e.g., 28, 29, 30, 31)
  const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const clampedDueDay = Math.max(1, Math.min(dueDay || 1, daysInMonth));

  const deadline = new Date(targetYear, targetMonth, clampedDueDay);
  if (gracePeriodDays > 0) {
    deadline.setDate(deadline.getDate() + gracePeriodDays);
  }
  deadline.setHours(23, 59, 59, 999);
  return deadline;
}

/**
 * Checks whether an unpaid obligation is overdue as of a given moment.
 */
export function isPaymentOverdue(
  billingMonth: string,
  method: RentCollectionMethod = "prepaid",
  dueDay: number = 1,
  gracePeriodDays: number = 0,
  asOf: Date = new Date(),
): boolean {
  const deadline = getBillingDeadline(billingMonth, method, dueDay, gracePeriodDays);
  return asOf.getTime() > deadline.getTime();
}

/**
 * Evaluates the authoritative payment state ("paid", "due", or "overdue").
 */
export function calculatePaymentState(
  paymentState: PaymentState | undefined,
  billingMonth: string,
  method: RentCollectionMethod = "prepaid",
  dueDay: number = 1,
  gracePeriodDays: number = 0,
  asOf: Date = new Date(),
): PaymentState {
  if (paymentState === "paid") {
    return "paid";
  }
  return isPaymentOverdue(billingMonth, method, dueDay, gracePeriodDays, asOf) ? "overdue" : "due";
}

/**
 * Checks whether a tenant has an active rent liability for a given billing month.
 * - Returns false if the billing month is before the tenant's move-in / lease start month.
 * - Returns false if the tenant has vacated before this billing month.
 */
export function isTenantLiableForBillingMonth(
  tenant: { since?: string; leaseStart?: string; status: string; vacatedOn?: string },
  billingMonth: string,
): boolean {
  const startStr = tenant.leaseStart || tenant.since;
  if (startStr) {
    const startMonth = startStr.substring(0, 7) + "-01";
    if (billingMonth < startMonth) {
      return false;
    }
  }

  if (tenant.status === "vacated" && tenant.vacatedOn) {
    const vacatedMonth = tenant.vacatedOn.substring(0, 7) + "-01";
    if (billingMonth > vacatedMonth) {
      return false;
    }
  }

  return true;
}

