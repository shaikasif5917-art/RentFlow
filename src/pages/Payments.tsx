import { useMemo, useState } from "react";
import { Download, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/ui/PageHeader";
import { Surface } from "../components/ui/Surface";
import { Button } from "../components/ui/Button";
import { StatDisplay } from "../components/ui/StatDisplay";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Divider } from "../components/ui/Divider";
import { SearchField } from "../components/ui/SearchField";
import { Segmented } from "../components/ui/Segmented";
import { usePortfolio } from "../data/PortfolioContext";
import { portfolioTotals, plural } from "../data/selectors";
import { currency, paymentLabel, paymentTone } from "../utils/format";
import type { PaymentState } from "../data/types";

export default function Payments() {
  const { payments, properties, units, tenants, isLoading } = usePortfolio();
  
  const [query, setQuery] = useState("");
  const [filterState, setFilterState] = useState<PaymentState | "all">("all");
  const [monthFilter, setMonthFilter] = useState("all");

  const totals = portfolioTotals(properties, units, tenants);
  
  const months = useMemo(() => {
    const m = new Set(payments.map(p => p.billingMonth));
    return Array.from(m).sort().reverse();
  }, [payments]);

  const visiblePayments = useMemo(() => {
    const q = query.trim().toLowerCase();
    return payments.filter((p) => {
      const matchQuery = !q || p.tenant.toLowerCase().includes(q) || p.property.toLowerCase().includes(q);
      const matchState = filterState === "all" || p.state === filterState;
      const matchMonth = monthFilter === "all" || p.billingMonth === monthFilter;
      return matchQuery && matchState && matchMonth;
    });
  }, [payments, query, filterState, monthFilter]);

  const pending = visiblePayments.filter((p) => p.state !== "paid");

  const handleExport = () => {
    const headers = ["Tenant", "Property", "Unit", "Amount", "Method", "Status", "Date", "Billing Month"];
    const csv = [
      headers.join(","),
      ...visiblePayments.map(p => 
        `"${p.tenant}","${p.property}","${p.unit}",${p.amount},"${p.method}","${p.state}","${p.date}","${p.billingMonth}"`
      )
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 sm:space-y-8 pb-4">
      <PageHeader
        eyebrow="Finance"
        title="Payments"
        description="Track incoming rent, outstanding balances, and payment methods."
        actions={
          <Button variant="secondary" size="sm" icon={<Download />} onClick={handleExport}>
            Export CSV
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-3">
        <Surface elevated className="relative overflow-hidden p-4 sm:p-6 transition-all duration-300 hover:-translate-y-1">
          <div className="pointer-events-none absolute -right-6 -bottom-6 size-16 sm:size-24 rounded-full bg-emerald-500/10 blur-xl sm:blur-2xl" />
          <StatDisplay label="Collected" value={currency(totals.collected, { compact: true })} />
        </Surface>
        <Surface elevated className="relative overflow-hidden p-4 sm:p-6 transition-all duration-300 hover:-translate-y-1">
          <div className="pointer-events-none absolute -right-6 -bottom-6 size-16 sm:size-24 rounded-full bg-rose-500/10 blur-xl sm:blur-2xl" />
          <StatDisplay
            label="Outstanding"
            value={currency(totals.outstanding, { compact: true })}
            tone={totals.outstanding > 0 ? "critical" : "default"}
            hint={
              pending.length > 0 ? (
                <span className="font-medium text-[var(--color-warning)]">{plural(pending.length, "pending")}</span>
              ) : (
                "All clear"
              )
            }
          />
        </Surface>
        <Surface elevated className="col-span-2 sm:col-span-1 relative overflow-hidden p-4 sm:p-6 transition-all duration-300 hover:-translate-y-1">
          <div className="pointer-events-none absolute -right-6 -bottom-6 size-16 sm:size-24 rounded-full bg-blue-500/10 blur-xl sm:blur-2xl" />
          <StatDisplay label="Expected" value={currency(totals.expected, { compact: true })} />
        </Surface>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between pt-2 sm:pt-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <SearchField
              containerClassName="flex-1 sm:w-72"
              placeholder="Search tenant..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="flex sm:hidden items-center rounded-[10px] border border-white/70 bg-white/60 px-2 py-1.5 backdrop-blur-md shadow-sm">
              <Filter className="size-4 text-[var(--color-ink-faint)]" />
              <select
                className="w-full bg-transparent text-[13px] font-medium text-[var(--color-ink)] outline-none cursor-pointer"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
              >
                <option value="all">All</option>
                {months.map((m) => (
                  <option key={m} value={m}>{new Date(m).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0 scrollbar-hide">
            <Segmented<PaymentState | "all">
              label="Filter by state"
              value={filterState}
              onChange={setFilterState}
              options={[
                { value: "all", label: "All" },
                { value: "due", label: "Due" },
                { value: "paid", label: "Paid" },
                { value: "overdue", label: "Overdue" },
              ]}
            />
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-[12px] border border-white/70 bg-white/60 px-3 py-1.5 backdrop-blur-md shadow-sm text-sm text-[var(--color-ink-soft)]">
            <Filter className="size-3.5 text-[var(--color-ink-faint)]" />
            <select
              className="bg-transparent text-[13px] font-medium text-[var(--color-ink)] outline-none cursor-pointer"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
            >
              <option value="all">All months</option>
              {months.map((m) => (
                <option key={m} value={m}>{new Date(m).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <Surface elevated className="overflow-hidden">
        <div className="hidden grid-cols-[1.4fr_1.4fr_1fr_0.8fr_auto] gap-4 border-b border-[var(--color-line)] bg-[var(--color-surface-muted)] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-faint)] md:grid">
          <span>Tenant</span>
          <span>Property</span>
          <span>Method</span>
          <span className="text-right">Amount</span>
          <span className="w-24 text-right">Status</span>
        </div>

        {isLoading && payments.length === 0 ? (
          <div className="flex min-h-[400px] items-center justify-center text-[14px] text-[var(--color-ink-faint)]">
            Loading payments...
          </div>
        ) : visiblePayments.length === 0 ? (
          <div className="p-8 text-center text-[var(--color-ink-faint)]">
            {payments.length === 0 ? "No payments recorded yet." : "No payments match your filters."}
          </div>
        ) : (
          visiblePayments.map((p, i) => (
            <div key={p.id}>
              {i > 0 && <Divider />}
              <div className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 sm:px-5 sm:py-4 md:grid-cols-[1.4fr_1.4fr_1fr_0.8fr_auto]">
                <div className="min-w-0">
                  <Link
                    to={`/tenants/${p.tenantId}`}
                    className="truncate text-[13.5px] sm:text-[14px] font-semibold sm:font-medium text-[var(--color-ink)] underline-offset-4 hover:underline"
                  >
                    {p.tenant}
                  </Link>
                  <div className="truncate text-[12px] text-[var(--color-ink-faint)] md:hidden">
                    {p.unit} · {p.date ? new Date(p.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : new Date(p.billingMonth + "T00:00:00").toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <span className="hidden truncate text-[13px] text-[var(--color-ink-soft)] md:block">
                  <Link to={`/properties/${p.propertyId}`} className="underline-offset-4 hover:text-[var(--color-ink)] hover:underline">
                    {p.property}
                  </Link>{" "}
                  · {p.unit}
                </span>
                <span className="hidden text-[13px] text-[var(--color-ink-soft)] md:block">{p.method || "—"}</span>
                <div className="flex flex-col items-end gap-1 md:hidden">
                  <span className="tabular text-right text-[13.5px] font-bold text-[var(--color-ink)]">
                    {currency(p.amount, { compact: true })}
                  </span>
                  <StatusBadge tone={paymentTone(p.state)} className="scale-90 origin-right">
                    {paymentLabel(p.state)}
                  </StatusBadge>
                </div>
                
                <span className="hidden md:block tabular text-right text-[14px] font-semibold text-[var(--color-ink)]">
                  {currency(p.amount)}
                </span>
                <span className="hidden md:flex justify-end w-24">
                  <StatusBadge tone={paymentTone(p.state)} dot>
                    {paymentLabel(p.state)}
                  </StatusBadge>
                </span>
              </div>
            </div>
          ))
        )}
      </Surface>
    </div>
  );
}
