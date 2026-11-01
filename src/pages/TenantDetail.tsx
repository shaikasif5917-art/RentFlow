import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, Mail, Phone, Users, Pencil } from "lucide-react";
import { usePortfolio } from "../data/PortfolioContext";
import { unitLabel } from "../data/selectors";
import { currency, paymentLabel, paymentTone } from "../utils/format";
import {
  getActiveCollectionMonth,
  parseBillingMonth,
  isPaymentOverdue,
  type RentCollectionMethod,
} from "../utils/billing";
import { TenantNotes } from "../components/property/TenantNotes";
import { UpdateRentModal, VacateTenantModal, EditTenantRentModal, EditTenantNameModal } from "../components/property/UnitModals";
import { PageHeader } from "../components/ui/PageHeader";
import { Surface } from "../components/ui/Surface";
import { StatDisplay } from "../components/ui/StatDisplay";
import { StatusBadge } from "../components/ui/StatusBadge";
import { SectionHeader } from "../components/ui/SectionHeader";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";

export default function TenantDetail() {
  const { tenantId } = useParams();
  const { tenants, payments, profile, isLoading } = usePortfolio();
  const [editingRent, setEditingRent] = useState(false);
  const [editingAgreedRent, setEditingAgreedRent] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [vacating, setVacating] = useState(false);
  const tenant = tenants.find((t) => t.id === tenantId);

  if (isLoading && !tenant) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-[14px] text-[var(--color-ink-faint)]">
        Loading tenant details...
      </div>
    );
  }

  if (!tenant) {
    return (
      <EmptyState
        className="pt-10"
        icon={<Users />}
        title="Tenant not found"
        description="This tenant may have moved out, or the link is out of date."
        action={
          <Link to="/tenants">
            <Button variant="secondary" size="sm" icon={<ChevronLeft />}>
              Back to tenants
            </Button>
          </Link>
        }
      />
    );
  }

  const collectionMethod = (profile?.rent_collection_method as RentCollectionMethod) || "prepaid";
  const dueDay = profile?.default_due_day || 1;
  const gracePeriod = profile?.grace_period_days || 0;
  const today = new Date();
  const currentBillingMonth = getActiveCollectionMonth(collectionMethod, today);
  const { year, monthIndex } = parseBillingMonth(currentBillingMonth);
  const monthName = new Date(year, monthIndex, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const history = payments.filter((p) => p.tenantId === tenant.id);
  const currentPayment = history.find((p) => p.billingMonth === currentBillingMonth);
  const currentStatus =
    currentPayment?.state ||
    (isPaymentOverdue(currentBillingMonth, collectionMethod, dueDay, gracePeriod, today)
      ? "overdue"
      : "due");

  return (
    <div className="space-y-5 sm:space-y-8 pb-24 sm:pb-0">
      <div className="space-y-6">
        <nav className="flex items-center gap-1.5 text-[13px] text-[var(--color-ink-faint)]">
          <Link to="/tenants" className="-ml-1 inline-flex items-center gap-1 rounded-md px-1 py-0.5 transition-colors hover:text-[var(--color-ink)]">
            <ChevronLeft className="size-4 stroke-[1.7]" />
            Tenants
          </Link>
          <span>/</span>
          <span className="text-[var(--color-ink-soft)]">{tenant.name}</span>
        </nav>
        <PageHeader
          eyebrow={`Tenant since ${tenant.since}`}
          title={
            <span className="inline-flex items-center gap-2 sm:gap-3 flex-wrap">
              <span>{tenant.name}</span>
              <button
                type="button"
                onClick={() => setEditingName(true)}
                title="Edit tenant name"
                aria-label="Edit tenant name"
                className="inline-flex size-8 sm:size-9 items-center justify-center rounded-lg border border-[var(--color-line)] bg-white/60 text-[var(--color-ink-soft)] shadow-sm transition-all hover:bg-white hover:text-[var(--color-ink)] hover:border-[var(--color-ink-faint)] cursor-pointer active:scale-95"
              >
                <Pencil className="size-4" />
              </button>
            </span>
          }
          description={
            <span>
              <Link to={`/properties/${tenant.propertyId}`} className="underline-offset-4 hover:text-[var(--color-ink)] hover:underline">
                {tenant.property}
              </Link>{" "}
              · {unitLabel(tenant.unit)}
            </span>
          }
          actions={
            <div className="flex items-center gap-3">
              {tenant.status === "vacated" ? (
                <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-[12px] font-bold uppercase tracking-wider text-red-700 ring-1 ring-inset ring-red-200">
                  Vacated
                </span>
              ) : (
                <>
                  <button
                    onClick={() => setEditingRent(true)}
                    className="cursor-pointer transition-opacity hover:opacity-80"
                  >
                    <StatusBadge tone={paymentTone(currentStatus)} dot>
                      Rent {paymentLabel(currentStatus).toLowerCase()}
                    </StatusBadge>
                  </button>
                  <Button size="sm" variant="secondary" onClick={() => setVacating(true)}>
                    Vacate
                  </Button>
                </>
              )}
            </div>
          }
        />
      </div>

      <div className="grid gap-3 sm:gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Surface elevated className="p-4 sm:p-7 space-y-4 sm:space-y-6">
          <div className="flex items-start justify-between">
            <StatDisplay size="lg" label="Monthly rent" value={currency(tenant.rent)} hint={`${unitLabel(tenant.unit)} · ${tenant.property}`} />
            {tenant.status === "active" && (
              <Button size="sm" variant="ghost" icon={<Pencil className="size-4" />} onClick={() => setEditingAgreedRent(true)}>
                Edit
              </Button>
            )}
          </div>
          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4">
            {tenant.status === "vacated" && tenant.vacatedOn ? (
              <div className="space-y-1">
                <div className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-ink-faint)]">
                  Tenancy Ended
                </div>
                <div className="text-[14px] text-[var(--color-ink)]">
                  Vacated on {new Date(tenant.vacatedOn).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-ink-faint)]">
                    {monthName}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[15px] font-semibold text-[var(--color-ink)]">{currency(tenant.rent)}</span>
                    <StatusBadge tone={paymentTone(currentStatus)} dot>{paymentLabel(currentStatus)}</StatusBadge>
                  </div>
                  {currentPayment?.state === "paid" && (
                    <div className="text-[13px] text-[var(--color-ink-soft)] mt-2 space-y-1">
                      {currentPayment.recordedAt ? (
                        <>
                          <div>Payment Date: {new Date(currentPayment.recordedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
                          <div>Payment Time: {new Date(currentPayment.recordedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</div>
                        </>
                      ) : currentPayment.date ? (
                        <div>Paid on {new Date(currentPayment.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
                      ) : null}
                    </div>
                  )}
                </div>
                <Button size="sm" variant="ghost" onClick={() => setEditingRent(true)}>
                  Edit Status
                </Button>
              </div>
            )}
          </div>
        </Surface>
        <Surface elevated className="space-y-3 sm:space-y-4 p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <Avatar name={tenant.name} size="lg" />
            <div className="text-[15px] font-semibold text-[var(--color-ink)]">{tenant.name}</div>
          </div>
          <div className="min-w-0 space-y-2.5 text-[13.5px] text-[var(--color-ink-soft)]">
            <div className="flex items-center gap-2.5">
              <Phone className="size-4 shrink-0 stroke-[1.6] text-[var(--color-ink-faint)]" />
              <span className="tabular truncate">{tenant.phone}</span>
            </div>
            <div className="flex items-center gap-2.5 min-w-0">
              <Mail className="size-4 shrink-0 stroke-[1.6] text-[var(--color-ink-faint)]" />
              <span className="min-w-0 break-all">{tenant.email}</span>
            </div>
          </div>
        </Surface>
      </div>

      <Surface elevated className="overflow-hidden">
        <div className="px-4 pt-4 sm:px-5 sm:pt-5">
          <SectionHeader title="Payments" count={history.length} />
        </div>
        {history.length === 0 ? (
          <EmptyState className="py-10" title="No payments yet" description="Rent payments will be listed here." />
        ) : (
          <div className="mt-2 divide-y divide-[var(--color-line)]">
            {history.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-5 sm:py-4">
                <div>
                  <div className="tabular text-[14px] font-semibold text-[var(--color-ink)]">{currency(p.amount)}</div>
                  <div className="text-[12.5px] text-[var(--color-ink-soft)]">
                    {p.state === "paid"
                      ? `${p.date ? new Date(p.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Paid"} · ${p.method || "Payment"}`
                      : `Billed for ${new Date(p.billingMonth).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`}
                  </div>
                </div>
                <StatusBadge tone={paymentTone(p.state)} dot>
                  {paymentLabel(p.state)}
                </StatusBadge>
              </div>
            ))}
          </div>
        )}
      </Surface>

      <TenantNotes tenant={tenant} />

      <UpdateRentModal
        open={editingRent}
        onClose={() => setEditingRent(false)}
        tenant={tenant}
        billingMonth={currentBillingMonth}
        initialState={currentStatus}
        initialMethod={currentPayment?.method}
        rentAmount={currentPayment?.amount || tenant.rent}
      />
      
      <EditTenantRentModal
        open={editingAgreedRent}
        onClose={() => setEditingAgreedRent(false)}
        tenant={tenant}
      />
      
      <VacateTenantModal
        open={vacating}
        onClose={() => setVacating(false)}
        tenant={tenant}
      />

      <EditTenantNameModal
        open={editingName}
        onClose={() => setEditingName(false)}
        tenant={tenant}
      />
    </div>
  );
}
