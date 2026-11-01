import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Pencil,
  SearchX,
  UserPlus,
  Users,
} from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Surface } from "../components/ui/Surface";
import { Button } from "../components/ui/Button";
import { SearchField } from "../components/ui/SearchField";
import { Avatar } from "../components/ui/Avatar";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Divider } from "../components/ui/Divider";
import { EmptyState } from "../components/ui/EmptyState";
import { usePortfolio } from "../data/PortfolioContext";
import {
  plural,
  getTenantMonthStatus,
  getMonthlyTenantsSummary,
  type TenantMonthState,
} from "../data/selectors";
import { currency } from "../utils/format";
import {
  getActiveCollectionMonth,
  parseBillingMonth,
  type RentCollectionMethod,
} from "../utils/billing";
import {
  UpdateRentModal,
  EditTenantNameModal,
} from "../components/property/UnitModals";
import type { PaymentMethod, Tenant } from "../data/types";

interface EditingMonthData {
  tenant: Tenant;
  month: string;
  initialState: TenantMonthState;
  initialMethod?: PaymentMethod;
  amount: number;
}

export default function Tenants() {
  const { tenants, payments, profile, isLoading } = usePortfolio();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [editingMonthData, setEditingMonthData] = useState<EditingMonthData | null>(null);
  const [renamingTenant, setRenamingTenant] = useState<Tenant | null>(null);

  const collectionMethod = (profile?.rent_collection_method as RentCollectionMethod) || "prepaid";
  const dueDay = profile?.default_due_day || 1;
  const gracePeriod = profile?.grace_period_days || 0;

  // Active collection cycle month based on billing rules (postpaid = preceding month, prepaid = current)
  const activeCycleMonth = useMemo(
    () => getActiveCollectionMonth(collectionMethod, new Date()),
    [collectionMethod],
  );

  const [selectedMonth, setSelectedMonth] = useState<string>(activeCycleMonth);

  // Sync when activeCycleMonth resolves
  useEffect(() => {
    setSelectedMonth(activeCycleMonth);
  }, [activeCycleMonth]);

  // Generate available months (e.g. past 6 months through next 2 months + database history)
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    const now = new Date();

    // 6 months in the past through 2 months in the future
    for (let i = -6; i <= 2; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      monthsSet.add(`${y}-${m}-01`);
    }

    // Add existing payment billing months
    payments.forEach((p) => {
      if (p.billingMonth) {
        monthsSet.add(p.billingMonth.substring(0, 7) + "-01");
      }
    });

    // Ensure active cycle month is always included
    monthsSet.add(activeCycleMonth);

    return Array.from(monthsSet).sort().reverse(); // Chronological reverse (latest first)
  }, [payments, activeCycleMonth]);

  // Format month to human label (e.g. "October 2026")
  const formatMonthName = (monthStr: string) => {
    try {
      const { year, monthIndex } = parseBillingMonth(monthStr);
      return new Date(year, monthIndex, 1).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    } catch {
      return monthStr;
    }
  };

  const selectedMonthLabel = useMemo(
    () => formatMonthName(selectedMonth),
    [selectedMonth],
  );

  // Navigation handlers
  const currentIdx = availableMonths.indexOf(selectedMonth);
  const hasNextMonth = currentIdx > 0; // newer month
  const hasPrevMonth = currentIdx >= 0 && currentIdx < availableMonths.length - 1; // older month

  const handlePrevMonth = () => {
    if (hasPrevMonth) {
      setSelectedMonth(availableMonths[currentIdx + 1]);
    }
  };

  const handleNextMonth = () => {
    if (hasNextMonth) {
      setSelectedMonth(availableMonths[currentIdx - 1]);
    }
  };

  // Month-wise summary
  const summary = useMemo(() => {
    return getMonthlyTenantsSummary(
      tenants,
      selectedMonth,
      payments,
      collectionMethod,
      dueDay,
      gracePeriod,
      new Date(),
    );
  }, [tenants, selectedMonth, payments, collectionMethod, dueDay, gracePeriod]);

  // Filtered tenants by search query
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = tenants.filter(
      (t) => !q || `${t.name} ${t.property} ${t.unit}`.toLowerCase().includes(q),
    );

    return filtered.sort((a, b) => {
      if (a.status === b.status) return 0;
      return a.status === "active" ? -1 : 1;
    });
  }, [tenants, query]);

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      <PageHeader
        eyebrow="People"
        title="Tenants"
        description={`${plural(tenants.length, "tenant")} across your portfolio`}
        actions={
          <Button size="sm" icon={<UserPlus />} onClick={() => navigate("/properties")}>
            Add tenant
          </Button>
        }
      />

      {/* Month-Wise Financial Summary Card */}
      <Surface
        elevated
        className="overflow-hidden p-5 sm:p-6 bg-gradient-to-br from-white/95 to-[#f4f7f0]/80 border border-[#cfe1b9]/70 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#cfe1b9]/50">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#718355] flex items-center gap-1.5">
              <span>Month Overview</span>
              <span>·</span>
              <span>{selectedMonthLabel}</span>
              {selectedMonth === activeCycleMonth && (
                <span className="rounded-full bg-[#718355] px-2 py-0.5 text-[9.5px] font-bold text-white tracking-normal">
                  Active Cycle
                </span>
              )}
            </div>
            <div className="mt-1 flex items-baseline gap-2 flex-wrap">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#2b3428]">
                {currency(summary.collected)}
              </span>
              <span className="text-[13px] font-medium text-[var(--color-ink-soft)]">
                collected of {currency(summary.expected)} expected
              </span>
            </div>
          </div>

          {/* Quick status count pills */}
          <div className="flex flex-wrap items-center gap-2 text-[12px]">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800 border border-emerald-200/60">
              <span className="size-1.5 rounded-full bg-emerald-600" />
              {summary.paidCount} Paid
            </span>
            {summary.overdueCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1 font-semibold text-red-800 border border-red-200/60">
                <span className="size-1.5 rounded-full bg-red-600" />
                {summary.overdueCount} Overdue
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 font-semibold text-amber-800 border border-amber-200/60">
              <span className="size-1.5 rounded-full bg-amber-600" />
              {summary.dueCount} Due
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-[#e9f5db] px-2.5 py-1 font-semibold text-[#2b3428] border border-[#cfe1b9]">
              {summary.eligibleCount} Liable
            </span>
          </div>
        </div>

        {/* Progress Bar & Outstanding */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]">
          <div className="flex-1 max-w-md">
            <div className="flex items-center justify-between text-[12px] font-medium text-[var(--color-ink-soft)] mb-1.5">
              <span>Collection Rate</span>
              <span className="font-semibold text-[#2b3428]">
                {summary.expected > 0
                  ? Math.round((summary.collected / summary.expected) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#e9f5db]">
              <div
                className="h-full bg-[#718355] transition-all duration-500 rounded-full"
                style={{
                  width: `${
                    summary.expected > 0
                      ? Math.min(
                          100,
                          Math.round((summary.collected / summary.expected) * 100),
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 sm:text-right">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-faint)]">
                Outstanding
              </div>
              <div className="tabular text-[15px] font-bold text-[#a35a40]">
                {currency(summary.outstanding)}
              </div>
            </div>
          </div>
        </div>
      </Surface>

      {/* Month Selector & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Month Selector Control */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center rounded-xl border border-[#cfe1b9] bg-white shadow-2xs p-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={!hasPrevMonth}
              title="Previous Month"
              aria-label="Previous Month"
              className="flex size-8 items-center justify-center rounded-lg text-[#2b3428] hover:bg-[#e9f5db] disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
            >
              <ChevronLeft className="size-4" />
            </button>

            <div className="relative px-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none bg-transparent pr-6 text-[13.5px] font-bold text-[#2b3428] focus:outline-none cursor-pointer"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {formatMonthName(m)}
                    {m === activeCycleMonth ? " • Current Cycle" : ""}
                  </option>
                ))}
              </select>
              <Calendar className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 size-3.5 text-[#718355]" />
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              disabled={!hasNextMonth}
              title="Next Month"
              aria-label="Next Month"
              className="flex size-8 items-center justify-center rounded-lg text-[#2b3428] hover:bg-[#e9f5db] disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          {selectedMonth !== activeCycleMonth && (
            <button
              type="button"
              onClick={() => setSelectedMonth(activeCycleMonth)}
              className="text-[12px] font-semibold text-[#718355] hover:text-[#2b3428] hover:underline cursor-pointer px-1.5 py-1"
            >
              Reset to Current Cycle
            </button>
          )}
        </div>

        {/* Tenant Search Input */}
        <div className="w-full sm:max-w-xs">
          <SearchField
            placeholder="Search tenants, property or unit..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tenants Table / Cards */}
      <Surface elevated className="overflow-hidden">
        {isLoading && tenants.length === 0 ? (
          <div className="flex min-h-[400px] items-center justify-center text-[14px] text-[var(--color-ink-faint)]">
            Loading tenants...
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={query ? <SearchX /> : <Users />}
            title={query ? "No tenants found" : "No tenants yet"}
            description={
              query
                ? "Try a different name, property or unit."
                : "Tenants appear once a unit is rented."
            }
          />
        ) : (
          <>
            <div className="hidden grid-cols-[1.6fr_1.4fr_0.8fr_1.5fr_auto] gap-4 border-b border-[var(--color-line)] bg-[var(--color-surface-muted)] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-faint)] md:grid">
              <span>Tenant</span>
              <span>Property</span>
              <span>Since</span>
              <span className="text-right">{selectedMonthLabel} Rent</span>
              <span></span>
            </div>

            {visible.map((t, i) => {
              const formattedDate = isNaN(new Date(t.since).getTime())
                ? t.since
                : new Date(t.since).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });

              const monthStatus = getTenantMonthStatus(
                t,
                selectedMonth,
                payments,
                collectionMethod,
                dueDay,
                gracePeriod,
                new Date(),
              );

              return (
                <div key={t.id}>
                  {i > 0 && <Divider />}
                  <div
                    onClick={() => navigate(`/tenants/${t.id}`)}
                    className="group block md:grid md:grid-cols-[1.6fr_1.4fr_0.8fr_1.5fr_auto] md:items-center gap-4 px-5 py-4 transition-all duration-200 cursor-pointer hover:bg-white/75 hover:backdrop-blur-sm"
                  >
                    {/* MOBILE LAYOUT (hidden on md) */}
                    <div className="flex md:hidden items-center gap-4 w-full">
                      <div className="shrink-0">
                        <Avatar name={t.name} size="md" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-[14px] font-medium tracking-[-0.01em] text-[var(--color-ink)]">
                            {t.name}
                          </span>
                          <button
                            type="button"
                            title="Edit tenant name"
                            aria-label={`Edit name for ${t.name}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenamingTenant(t);
                            }}
                            className="inline-flex items-center justify-center size-6 rounded text-[var(--color-ink-faint)] transition-colors hover:bg-black/5 hover:text-[var(--color-ink)] cursor-pointer shrink-0"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                        </div>
                        <div className="mt-0.5 truncate text-[12.5px] text-[var(--color-ink-soft)]">
                          {t.property} · {t.unit}
                        </div>
                      </div>

                      <div className="shrink-0 flex flex-col items-end gap-1.5">
                        {monthStatus.status === "vacated" ? (
                          <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-red-700 ring-1 ring-inset ring-red-200">
                            Vacated
                          </span>
                        ) : monthStatus.status === "not_started" ? (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                            Not Started
                          </span>
                        ) : (
                          <>
                            <div className="tabular text-[13px] font-semibold text-[var(--color-ink)]">
                              {currency(monthStatus.amount)}
                            </div>
                            <div
                              role="button"
                              tabIndex={0}
                              title={`Change ${selectedMonthLabel} rent status`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingMonthData({
                                  tenant: t,
                                  month: selectedMonth,
                                  initialState: monthStatus.status,
                                  initialMethod: monthStatus.paymentRecord?.method,
                                  amount: monthStatus.amount,
                                });
                              }}
                              className="cursor-pointer transition-transform active:scale-95"
                            >
                              {monthStatus.status === "paid" ? (
                                <StatusBadge tone="positive" dot>
                                  Paid
                                  {monthStatus.paymentRecord?.method
                                    ? ` · ${monthStatus.paymentRecord.method}`
                                    : ""}
                                </StatusBadge>
                              ) : monthStatus.status === "overdue" ? (
                                <StatusBadge tone="critical" dot>
                                  Overdue
                                </StatusBadge>
                              ) : (
                                <StatusBadge tone="warning" dot>
                                  Due
                                </StatusBadge>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* DESKTOP LAYOUT (hidden on mobile, uses grid on md) */}
                    <div className="hidden md:flex items-center gap-3 min-w-0">
                      <div className="shrink-0">
                        <Avatar name={t.name} size="md" />
                      </div>
                      <span className="truncate text-[14px] font-medium tracking-[-0.01em] text-[var(--color-ink)]">
                        {t.name}
                      </span>
                      <button
                        type="button"
                        title="Edit tenant name"
                        aria-label={`Edit name for ${t.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenamingTenant(t);
                        }}
                        className="inline-flex items-center justify-center size-7 rounded-lg text-[var(--color-ink-faint)] transition-colors hover:bg-black/5 hover:text-[var(--color-ink)] cursor-pointer shrink-0 opacity-70 hover:opacity-100"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                    </div>

                    <div className="hidden md:block min-w-0">
                      <div className="truncate text-[13.5px] font-medium text-[var(--color-ink)]">
                        {t.property}
                      </div>
                      <div className="mt-0.5 truncate text-[12.5px] text-[var(--color-ink-soft)]">
                        {t.unit}
                      </div>
                    </div>

                    <div className="hidden md:block whitespace-nowrap tabular text-[13px] text-[var(--color-ink-soft)]">
                      {formattedDate}
                    </div>

                    <div className="hidden md:flex flex-col items-end justify-center gap-1.5 pr-2">
                      {monthStatus.status === "vacated" ? (
                        <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-red-700 ring-1 ring-inset ring-red-200">
                          Vacated
                        </span>
                      ) : monthStatus.status === "not_started" ? (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-600">
                          Not Started
                        </span>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-ink-faint)]">
                              {selectedMonthLabel}
                            </span>
                            <span className="tabular text-[13.5px] font-semibold text-[var(--color-ink)]">
                              {currency(monthStatus.amount)}
                            </span>
                          </div>
                          <div
                            role="button"
                            tabIndex={0}
                            title={`Change ${selectedMonthLabel} rent status`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingMonthData({
                                tenant: t,
                                month: selectedMonth,
                                initialState: monthStatus.status,
                                initialMethod: monthStatus.paymentRecord?.method,
                                amount: monthStatus.amount,
                              });
                            }}
                            className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
                          >
                            {monthStatus.status === "paid" ? (
                              <StatusBadge tone="positive" dot>
                                Paid
                                {monthStatus.paymentRecord?.method
                                  ? ` · ${monthStatus.paymentRecord.method}`
                                  : ""}
                              </StatusBadge>
                            ) : monthStatus.status === "overdue" ? (
                              <StatusBadge tone="critical" dot>
                                Overdue
                              </StatusBadge>
                            ) : (
                              <StatusBadge tone="warning" dot>
                                Due
                              </StatusBadge>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="hidden md:flex justify-end">
                      <ChevronRight className="size-4 stroke-[1.7] text-[var(--color-ink-faint)] transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </Surface>

      {/* Month-Wise Rent Update Modal */}
      <UpdateRentModal
        open={!!editingMonthData}
        onClose={() => setEditingMonthData(null)}
        tenant={editingMonthData?.tenant || null}
        billingMonth={editingMonthData?.month}
        initialState={editingMonthData?.initialState}
        initialMethod={editingMonthData?.initialMethod}
        rentAmount={editingMonthData?.amount}
      />

      {/* Edit Tenant Name Modal */}
      <EditTenantNameModal
        open={!!renamingTenant}
        onClose={() => setRenamingTenant(null)}
        tenant={renamingTenant}
      />
    </div>
  );
}
