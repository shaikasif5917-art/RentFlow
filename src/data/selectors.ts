import type { Property, PropertyState, Tenant, Unit, Payment } from "./types";
import { isPaymentOverdue, isTenantLiableForBillingMonth, type RentCollectionMethod } from "../utils/billing";

export type TenantMonthState = "paid" | "due" | "overdue" | "not_started" | "vacated";

export interface TenantMonthStatus {
  status: TenantMonthState;
  amount: number;
  paymentRecord?: Payment;
  isLiable: boolean;
}

export function getTenantMonthStatus(
  tenant: Tenant,
  billingMonth: string,
  payments: Payment[],
  collectionMethod: RentCollectionMethod = "prepaid",
  dueDay: number = 1,
  gracePeriodDays: number = 0,
  asOf: Date = new Date(),
): TenantMonthStatus {
  const isLiable = isTenantLiableForBillingMonth(tenant, billingMonth);
  if (!isLiable) {
    const startStr = tenant.since;
    if (startStr && billingMonth < startStr.substring(0, 7) + "-01") {
      return { status: "not_started", amount: 0, isLiable: false };
    }
    return { status: "vacated", amount: 0, isLiable: false };
  }

  const payment = payments.find(
    (p) => p.tenantId === tenant.id && p.billingMonth === billingMonth
  );

  const amount = payment?.amount ?? tenant.rent;

  if (payment?.state === "paid") {
    return { status: "paid", amount, paymentRecord: payment, isLiable: true };
  }

  const overdue = isPaymentOverdue(billingMonth, collectionMethod, dueDay, gracePeriodDays, asOf);
  return {
    status: overdue ? "overdue" : "due",
    amount,
    paymentRecord: payment,
    isLiable: true,
  };
}

export interface MonthlyTenantsSummary {
  eligibleCount: number;
  paidCount: number;
  dueCount: number;
  overdueCount: number;
  expected: number;
  collected: number;
  due: number;
  overdue: number;
  outstanding: number;
  collectionRate: number;
  completedTransactionsCount: number;
}

export function getMonthlyTenantsSummary(
  tenants: Tenant[],
  billingMonth: string,
  payments: Payment[],
  collectionMethod: RentCollectionMethod = "prepaid",
  dueDay: number = 1,
  gracePeriodDays: number = 0,
  asOf: Date = new Date(),
): MonthlyTenantsSummary {
  let eligibleCount = 0;
  let paidCount = 0;
  let dueCount = 0;
  let overdueCount = 0;
  let expected = 0;
  let collected = 0;
  let due = 0;
  let overdue = 0;

  for (const t of tenants) {
    const monthStatus = getTenantMonthStatus(
      t,
      billingMonth,
      payments,
      collectionMethod,
      dueDay,
      gracePeriodDays,
      asOf
    );

    if (monthStatus.isLiable) {
      eligibleCount++;
      expected += monthStatus.amount;
      if (monthStatus.status === "paid") {
        paidCount++;
        collected += monthStatus.amount;
      } else if (monthStatus.status === "overdue") {
        overdueCount++;
        overdue += monthStatus.amount;
      } else {
        dueCount++;
        due += monthStatus.amount;
      }
    }
  }

  const completedTransactionsCount = payments.filter(
    (p) => p.billingMonth === billingMonth && p.state === "paid"
  ).length;

  const collectionRate = expected > 0 ? Math.round((collected / expected) * 100) : 0;

  return {
    eligibleCount,
    paidCount,
    dueCount,
    overdueCount,
    expected,
    collected,
    due,
    overdue,
    outstanding: Math.max(0, expected - collected),
    collectionRate,
    completedTransactionsCount,
  };
}

export interface PropertyMetrics {
  total: number;
  occupied: number;
  vacant: number;
  maintenance: number;
  /** Contracted monthly rent from occupied units */
  expected: number;
  collected: number;
  outstanding: number;
  overdueCount: number;
  /** Rent the vacant units would earn if let */
  potential: number;
  occupancy: number;
  state: PropertyState;
}

export function propertyMetrics(
  units: Unit[],
  tenants: Tenant[],
  payments?: Payment[],
  billingMonth?: string,
): PropertyMetrics {
  const byId = new Map(tenants.map((t) => [t.id, t]));
  let expected = 0;
  let collected = 0;
  let outstanding = 0;
  let overdueCount = 0;
  let occupied = 0;
  let vacant = 0;
  let maintenance = 0;
  let potential = 0;

  for (const u of units) {
    if (u.status === "occupied") {
      occupied++;
      const t = u.tenantId ? byId.get(u.tenantId) : undefined;
      // Active contracted tenant takes absolute precedence for rent accounting
      if (t && t.status === "active") {
        if (payments && billingMonth) {
          const p = payments.find(
            (pay) => pay.tenantId === t.id && pay.billingMonth === billingMonth
          );
          const actualRent = p?.amount ?? t.rent;
          expected += actualRent;
          if (p?.state === "paid") {
            collected += actualRent;
          } else {
            outstanding += actualRent;
            if (p?.state === "overdue") {
              overdueCount++;
            }
          }
        } else {
          const actualRent = t.rent;
          expected += actualRent;
          if (t.state === "paid") {
            collected += actualRent;
          } else {
            outstanding += actualRent;
            if (t.state === "overdue") {
              overdueCount++;
            }
          }
        }
      } else {
        // Fallback to unit default rent if occupied without an active tenant profile
        expected += u.rent;
        outstanding += u.rent;
      }
    } else if (u.status === "vacant") {
      vacant++;
      potential += u.rent;
    } else {
      maintenance++;
    }
  }

  const total = units.length;
  const occupancy = total ? (occupied / total) * 100 : 0;
  const state: PropertyState =
    maintenance > 0 ? "maintenance" : total === 0 || occupancy < 80 ? "vacant" : "occupied";

  return { total, occupied, vacant, maintenance, expected, collected, outstanding, overdueCount, potential, occupancy, state };
}

export function portfolioTotals(
  properties: Property[],
  units: Unit[],
  tenants: Tenant[],
  payments?: Payment[],
  billingMonth?: string,
) {
  const m = propertyMetrics(units, tenants, payments, billingMonth);
  return { ...m, properties: properties.length, units: m.total };
}

export function formatPercent(value: number) {
  return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;
}

export function unitBreakdown(m: PropertyMetrics) {
  const parts = [`${m.occupied} occupied`];
  if (m.vacant > 0) parts.push(`${m.vacant} vacant`);
  if (m.maintenance > 0) parts.push(`${m.maintenance} in maintenance`);
  return parts.join(" · ");
}

export const stateLabel: Record<PropertyState, string> = {
  occupied: "Occupied",
  vacant: "Vacant",
  maintenance: "Maintenance",
};

/** "Unit 101", but plain "Villa" / "House" for unnumbered units */
export function unitLabel(number: string) {
  return /^[A-Za-z]{4,}$/.test(number) ? number : `Unit ${number}`;
}

export function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}
