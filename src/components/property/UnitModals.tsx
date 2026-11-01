import { useState, useEffect, useMemo } from "react";
import type { FormEvent, ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import type { PaymentMethod, Tenant, Unit } from "../../data/types";
import { usePortfolio } from "../../data/PortfolioContext";
import { currency } from "../../utils/format";
import { cn } from "../../utils/cn";
import {
  getActiveCollectionMonth,
  parseBillingMonth,
  formatLocalDate,
  type RentCollectionMethod,
} from "../../utils/billing";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { Field, Select, TextInput } from "../ui/Field";

interface ShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  formId: string;
  submitLabel: string;
  children: ReactNode;
  disabled?: boolean;
  isSubmitting?: boolean;
}

function ActionModal({ open, onClose, title, description, formId, submitLabel, children, disabled, isSubmitting }: ShellProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>
            {disabled ? "Close" : "Cancel"}
          </Button>
          {!disabled && (
            <Button type="submit" form={formId} disabled={isSubmitting}>
              {submitLabel}
            </Button>
          )}
        </>
      }
    >
      {children}
    </Modal>
  );
}

/* ------------------------------ Assign tenant ------------------------------ */

interface AssignProps {
  open: boolean;
  onClose: () => void;
  propertyId: string;
  /** When set the unit is fixed — used by "Mark as rented" */
  unitId?: string;
}

function AssignForm({ propertyId, unitId, onClose, setIsSubmitting }: Omit<AssignProps, "open"> & { setIsSubmitting: (v: boolean) => void }) {
  const { units, assignTenant } = usePortfolio();
  const vacant = units.filter((u) => u.propertyId === propertyId && u.status === "vacant");
  const [selected, setSelected] = useState(unitId ?? vacant[0]?.id ?? "");
  const unit = units.find((u) => u.id === selected);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [rent, setRent] = useState(String(unit?.rent ?? ""));
  const [error, setError] = useState("");

  const choose = (id: string) => {
    setSelected(id);
    const u = units.find((x) => x.id === id);
    if (u) setRent(String(u.rent));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Enter the tenant's name");
    if (!selected) return;
    setIsSubmitting(true);
    try {
      await assignTenant(selected, { name, phone, rent: Math.max(0, Number(rent) || 0) });
      onClose();
    } catch (err: any) {
      if (err?.code === "23505" || err?.message?.includes("unique") || err?.code === "P0001") {
        setError("This unit already has an active tenant.");
      } else {
        setError(err.message || "An error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!unitId && vacant.length === 0) {
    return (
      <EmptyState
        className="py-8"
        title="No vacant units"
        description="Every unit here is occupied or under maintenance. Add a unit to rent it out."
      />
    );
  }

  return (
    <form id="assign-form" onSubmit={submit} className="space-y-4" noValidate>
      {unitId ? (
        <div className="flex items-center justify-between rounded-[10px] border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">Unit</div>
            <div className="text-[15px] font-semibold text-[var(--color-ink)]">
              {unit?.number} <span className="font-normal text-[var(--color-ink-soft)]">· {unit?.config}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">Listed</div>
            <div className="tabular text-[15px] font-semibold text-[var(--color-ink)]">{currency(unit?.rent ?? 0)}</div>
          </div>
        </div>
      ) : (
        <Field label="Unit">
          <Select value={selected} onChange={(e) => choose(e.target.value)}>
            {vacant.map((u) => (
              <option key={u.id} value={u.id}>
                {u.number} · {u.config} · {currency(u.rent)}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Field label="Tenant name" error={error}>
        <TextInput value={name} onChange={(e) => { setName(e.target.value); setError(""); }} placeholder="Full name" autoFocus />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Phone">
          <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91" inputMode="tel" />
        </Field>
        <Field label="Monthly rent">
          <TextInput value={rent} onChange={(e) => setRent(e.target.value)} inputMode="numeric" />
        </Field>
      </div>
    </form>
  );
}

export function AssignTenantModal({ open, onClose, propertyId, unitId }: AssignProps) {
  const { units } = usePortfolio();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const noneVacant = !unitId && !units.some((u) => u.propertyId === propertyId && u.status === "vacant");
  return (
    <ActionModal
      disabled={noneVacant}
      isSubmitting={isSubmitting}
      open={open}
      onClose={onClose}
      title={unitId ? "Mark as rented" : "Add tenant"}
      description={unitId ? "Record the new tenant for this unit." : "Move a tenant into a vacant unit."}
      formId="assign-form"
      submitLabel={unitId ? "Mark as rented" : "Add tenant"}
    >
      <AssignForm propertyId={propertyId} unitId={unitId} onClose={onClose} setIsSubmitting={setIsSubmitting} />
    </ActionModal>
  );
}

/* -------------------------------- Add unit -------------------------------- */

function AddUnitForm({ propertyId, onClose, setIsSubmitting }: { propertyId: string; onClose: () => void; setIsSubmitting: (v: boolean) => void }) {
  const { addUnit, units } = usePortfolio();
  const [number, setNumber] = useState("");
  const [config, setConfig] = useState("2BHK");
  const [rent, setRent] = useState("18000");
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!number.trim()) return setError("Enter a unit number");
    if (units.some((u) => u.propertyId === propertyId && u.number.toLowerCase() === number.trim().toLowerCase()))
      return setError("This unit number already exists");
    setIsSubmitting(true);
    try {
      await addUnit(propertyId, { number, config, rent: Math.max(0, Number(rent) || 0) });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form id="unit-form" onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Unit number" error={error}>
          <TextInput value={number} onChange={(e) => { setNumber(e.target.value); setError(""); }} placeholder="e.g. 401" autoFocus />
        </Field>
        <Field label="Configuration">
          <TextInput value={config} onChange={(e) => setConfig(e.target.value)} placeholder="2BHK, Shop…" />
        </Field>
      </div>
      <Field label="Monthly rent">
        <TextInput value={rent} onChange={(e) => setRent(e.target.value)} inputMode="numeric" />
      </Field>
    </form>
  );
}

export function AddUnitModal({ open, onClose, propertyId }: { open: boolean; onClose: () => void; propertyId: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  return (
    <ActionModal isSubmitting={isSubmitting} open={open} onClose={onClose} title="Add unit" description="The unit is added as vacant." formId="unit-form" submitLabel="Add unit">
      <AddUnitForm propertyId={propertyId} onClose={onClose} setIsSubmitting={setIsSubmitting} />
    </ActionModal>
  );
}

/* ------------------------------- Record rent ------------------------------- */

function RecordRentForm({ propertyId, onClose, setIsSubmitting }: { propertyId: string; onClose: () => void; setIsSubmitting: (v: boolean) => void }) {
  const { units, tenants, recordRent } = usePortfolio();
  const pending: { unit: Unit; tenant: Tenant }[] = [];
  for (const u of units) {
    if (u.propertyId !== propertyId || u.status !== "occupied") continue;
    const t = tenants.find((x) => x.id === u.tenantId);
    if (t && t.state !== "paid") pending.push({ unit: u, tenant: t });
  }
  const [selected, setSelected] = useState(pending[0]?.unit.id ?? "");
  const [method, setMethod] = useState<PaymentMethod>("UPI");
  const current = pending.find((p) => p.unit.id === selected);

  if (pending.length === 0) {
    return (
      <EmptyState
        className="py-8"
        icon={<CheckCircle2 />}
        title="All rent is recorded"
        description="Every occupied unit in this property has paid for the month."
      />
    );
  }

  const [error, setError] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setIsSubmitting(true);
    try {
      await recordRent(selected, method);
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred while recording rent.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form id="rent-form" onSubmit={submit} className="space-y-4">
      <Field label="Unit" error={error}>
        <Select value={selected} onChange={(e) => setSelected(e.target.value)}>
          {pending.map(({ unit, tenant }) => (
            <option key={unit.id} value={unit.id}>
              {unit.number} · {tenant.name} · {tenant.state === "overdue" ? "overdue" : "due"}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount">
          <div className="flex h-11 items-center rounded-[10px] border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-3.5 text-sm font-semibold tabular text-[var(--color-ink)]">
            {currency(current?.tenant.rent ?? 0)}
          </div>
        </Field>
        <Field label="Method">
          <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
            {(["UPI", "Bank Transfer", "Cheque", "Cash"] as PaymentMethod[]).map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Select>
        </Field>
      </div>
    </form>
  );
}

export function RecordRentModal({ open, onClose, propertyId }: { open: boolean; onClose: () => void; propertyId: string }) {
  const { units, tenants } = usePortfolio();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nothingPending = !units.some((u) => {
    if (u.propertyId !== propertyId || u.status !== "occupied") return false;
    const t = tenants.find((x) => x.id === u.tenantId);
    return !!t && t.state !== "paid";
  });
  return (
    <ActionModal isSubmitting={isSubmitting} disabled={nothingPending} open={open} onClose={onClose} title="Record rent" description="Mark a pending payment as received." formId="rent-form" submitLabel="Record payment">
      <RecordRentForm propertyId={propertyId} onClose={onClose} setIsSubmitting={setIsSubmitting} />
    </ActionModal>
  );
}

/* ------------------------------- Add expense ------------------------------- */

const categories = ["Repairs", "Plumbing", "Electrical", "Painting", "Property tax", "Society charges", "Other"];

function ExpenseForm({ propertyId, onClose, setIsSubmitting }: { propertyId: string; onClose: () => void; setIsSubmitting: (v: boolean) => void }) {
  const { addExpense } = usePortfolio();
  const [category, setCategory] = useState(categories[0]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const n = Number(amount);
    if (!n || n <= 0) return setError("Enter the amount spent");
    setIsSubmitting(true);
    try {
      await addExpense(propertyId, { category, amount: n, note });
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred while adding expense.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form id="expense-form" onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category">
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <Field label="Amount" error={error}>
          <TextInput value={amount} onChange={(e) => { setAmount(e.target.value); setError(""); }} inputMode="numeric" placeholder="₹" autoFocus />
        </Field>
      </div>
      <Field label="Note" hint="optional">
        <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="What was it for?" />
      </Field>
    </form>
  );
}

export function AddExpenseModal({ open, onClose, propertyId }: { open: boolean; onClose: () => void; propertyId: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  return (
    <ActionModal isSubmitting={isSubmitting} open={open} onClose={onClose} title="Add expense" description="Logged to this property's activity." formId="expense-form" submitLabel="Add expense">
      <ExpenseForm propertyId={propertyId} onClose={onClose} setIsSubmitting={setIsSubmitting} />
    </ActionModal>
  );
}

/* ------------------------------- Update rent status ------------------------------- */

export function UpdateRentModal({
  open,
  onClose,
  tenant,
  billingMonth,
  initialState,
  initialMethod,
  rentAmount,
}: {
  open: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  billingMonth?: string;
  initialState?: "paid" | "due" | "overdue" | "not_started" | "vacated";
  initialMethod?: PaymentMethod;
  rentAmount?: number;
}) {
  const { updateRentStatus, profile } = usePortfolio();
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [method, setMethod] = useState<PaymentMethod>("UPI");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const collectionMethod = (profile?.rent_collection_method as RentCollectionMethod) || "prepaid";
  const effectiveMonth = billingMonth || getActiveCollectionMonth(collectionMethod, new Date());

  const monthLabel = useMemo(() => {
    try {
      const { year, monthIndex } = parseBillingMonth(effectiveMonth);
      return new Date(year, monthIndex, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } catch {
      return effectiveMonth;
    }
  }, [effectiveMonth]);

  // Sync state when modal opens
  useEffect(() => {
    if (open && tenant) {
      setIsPaid(initialState ? initialState === "paid" : tenant.state === "paid");
      setMethod(initialMethod || "UPI");
      setError("");
    }
  }, [open, tenant, initialState, initialMethod]);

  const displayRent = rentAmount !== undefined ? rentAmount : tenant?.rent || 0;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    setIsSubmitting(true);
    setError("");
    try {
      await updateRentStatus(tenant.id, isPaid, effectiveMonth, isPaid ? method : undefined);
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred while updating rent status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!tenant) return null;

  return (
    <ActionModal
      isSubmitting={isSubmitting}
      open={open}
      onClose={onClose}
      title={`${monthLabel} Rent Status`}
      description={`Tenant: ${tenant.name} · Unit: ${tenant.unit} · Rent: ${currency(displayRent)}`}
      formId="update-rent-form"
      submitLabel={isSubmitting ? "Saving..." : isPaid ? "Mark as Paid" : "Mark as Due / Unpaid"}
    >
      <form id="update-rent-form" onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-ink-faint)]">
            Payment Status for {monthLabel}
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setIsPaid(true)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl border p-3 font-semibold text-[13.5px] transition-all cursor-pointer",
                isPaid
                  ? "border-[#718355] bg-[#e9f5db] text-[#2b3428] shadow-xs ring-1 ring-[#718355]"
                  : "border-[var(--color-line)] bg-white/70 text-[var(--color-ink-soft)] hover:bg-white"
              )}
            >
              <span className="size-2.5 rounded-full bg-emerald-600" />
              Paid
            </button>
            <button
              type="button"
              onClick={() => setIsPaid(false)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl border p-3 font-semibold text-[13.5px] transition-all cursor-pointer",
                !isPaid
                  ? "border-[#a35a40] bg-[#fbf0ec] text-[#783622] shadow-xs ring-1 ring-[#a35a40]"
                  : "border-[var(--color-line)] bg-white/70 text-[var(--color-ink-soft)] hover:bg-white"
              )}
            >
              <span className="size-2.5 rounded-full bg-amber-600" />
              Due / Unpaid
            </button>
          </div>
        </div>

        {isPaid && (
          <div className="space-y-1.5 pt-1">
            <label className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-ink-faint)]">
              Payment Method
            </label>
            <Select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            >
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
            </Select>
          </div>
        )}

        <div className="rounded-xl border border-[var(--color-line)]/70 bg-[var(--color-surface-muted)]/50 p-3 text-[12px] text-[var(--color-ink-soft)]">
          {isPaid ? (
            <span>
              Marking as <strong>Paid</strong> records collection of {currency(displayRent)} for <strong>{monthLabel}</strong> without affecting any other months.
            </span>
          ) : (
            <span>
              Marking as <strong>Due / Unpaid</strong> clears recorded receipt dates for <strong>{monthLabel}</strong> and reverts its status to pending/overdue.
            </span>
          )}
        </div>

        {error && <div className="text-[13px] text-[var(--color-critical)]">{error}</div>}
      </form>
    </ActionModal>
  );
}

/* ------------------------------- Vacate tenant ------------------------------- */

export function VacateTenantModal({ open, onClose, tenant }: { open: boolean; onClose: () => void; tenant: Tenant | null }) {
  const { vacateTenant } = usePortfolio();
  const [vacatingDate, setVacatingDate] = useState<string>(formatLocalDate(new Date()));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setVacatingDate(formatLocalDate(new Date()));
      setError("");
    }
  }, [open]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    if (!vacatingDate) {
      setError("Please select a vacating date.");
      return;
    }
    if (vacatingDate < tenant.since) {
      setError(`Vacating date cannot be before move-in date (${new Date(tenant.since).toLocaleDateString()}).`);
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    try {
      await vacateTenant(tenant.id, vacatingDate);
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred while vacating tenant.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!tenant) return null;

  return (
    <ActionModal isSubmitting={isSubmitting} open={open} onClose={onClose} title="Vacate Tenant" description="Mark this tenant as vacated and free up the unit." formId="vacate-form" submitLabel={isSubmitting ? "Vacating..." : "Confirm Vacate"}>
      <form id="vacate-form" onSubmit={submit} className="space-y-4">
        <div className="rounded-[10px] border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4 text-sm">
          <div className="font-semibold text-[var(--color-ink)]">{tenant.name}</div>
          <div className="text-[var(--color-ink-soft)] mt-1">{tenant.property} · {tenant.unit}</div>
          <div className="text-[var(--color-ink-soft)] mt-1">Monthly rent: {currency(tenant.rent)}</div>
          <div className="text-[var(--color-ink-soft)] mt-1">Move-in date: {new Date(tenant.since).toLocaleDateString()}</div>
        </div>
        
        <Field label="Vacating Date" error={error}>
          <input 
            type="date" 
            value={vacatingDate}
            onChange={(e) => { setVacatingDate(e.target.value); setError(""); }}
            className="flex h-11 w-full rounded-[10px] border border-[var(--color-line)] bg-transparent px-3 text-[14px] text-[var(--color-ink)] outline-none transition-colors placeholder:text-[var(--color-ink-faint)] hover:border-[var(--color-line-heavy)] focus:border-[var(--color-ink)]"
          />
        </Field>
      </form>
    </ActionModal>
  );
}

/* ------------------------------- Edit tenant rent ------------------------------- */

export function EditTenantRentModal({ open, onClose, tenant }: { open: boolean; onClose: () => void; tenant: Tenant | null }) {
  const { updateTenantRent } = usePortfolio();
  const [rent, setRent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && tenant) {
      setRent(String(tenant.rent));
      setError("");
    }
  }, [open, tenant]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    
    const newRent = Number(rent);
    if (!rent || isNaN(newRent) || newRent <= 0) {
      setError("Please enter a valid positive amount.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    try {
      await updateTenantRent(tenant.id, newRent);
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred while updating rent.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!tenant) return null;

  return (
    <ActionModal isSubmitting={isSubmitting} open={open} onClose={onClose} title="Edit Monthly Rent" description="Update the agreed monthly rent for this tenancy." formId="edit-rent-form" submitLabel={isSubmitting ? "Saving..." : "Save Changes"}>
      <form id="edit-rent-form" onSubmit={submit} className="space-y-4">
        <div className="rounded-[10px] border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4 text-sm">
          <div className="font-semibold text-[var(--color-ink)]">{tenant.name}</div>
          <div className="text-[var(--color-ink-soft)] mt-1">{tenant.property} · {tenant.unit}</div>
        </div>
        
        <Field label="Monthly rent" error={error}>
          <TextInput 
            value={rent}
            onChange={(e) => { setRent(e.target.value); setError(""); }}
            inputMode="numeric"
            autoFocus
          />
        </Field>
      </form>
    </ActionModal>
  );
}

/* ------------------------------- Edit tenant name ------------------------------- */

export function EditTenantNameModal({
  open,
  onClose,
  tenant,
}: {
  open: boolean;
  onClose: () => void;
  tenant: Tenant | null;
}) {
  const { updateTenantName } = usePortfolio();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open && tenant) {
      setName(tenant.name);
      setError("");
      setSuccess(false);
      setIsSubmitting(false);
    }
  }, [open, tenant]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Tenant name cannot be empty.");
      return;
    }

    if (trimmed === tenant.name) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess(false);
    try {
      await updateTenantName(tenant.id, trimmed);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 400);
    } catch (err: any) {
      setError(err?.message || "Failed to update tenant name. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!tenant) return null;

  return (
    <ActionModal
      isSubmitting={isSubmitting}
      open={open}
      onClose={onClose}
      title="Edit Tenant Name"
      description="Update the displayed name for this tenant."
      formId="edit-tenant-name-form"
      submitLabel={isSubmitting ? "Saving..." : "Save Changes"}
    >
      <form id="edit-tenant-name-form" onSubmit={submit} className="space-y-4">
        <div className="rounded-[10px] border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4 text-sm">
          <div className="font-semibold text-[var(--color-ink)]">{tenant.name}</div>
          <div className="text-[var(--color-ink-soft)] mt-1">
            {tenant.property} · {tenant.unit}
          </div>
        </div>

        <Field label="Tenant Name" error={error}>
          <TextInput
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError("");
            }}
            placeholder="Enter tenant name"
            autoFocus
            disabled={isSubmitting}
          />
        </Field>

        {success && (
          <div className="flex items-center gap-2 rounded-lg bg-[var(--color-positive-wash)] px-3 py-2 text-[13px] font-medium text-[var(--color-positive)]">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>Tenant name updated successfully!</span>
          </div>
        )}
      </form>
    </ActionModal>
  );
}


