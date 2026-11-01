import type { Property, PropertyState, Tenant, Unit } from "./types";

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

export function propertyMetrics(units: Unit[], tenants: Tenant[]): PropertyMetrics {
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

export function portfolioTotals(properties: Property[], units: Unit[], tenants: Tenant[]) {
  const m = propertyMetrics(units, tenants);
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
