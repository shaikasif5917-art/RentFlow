import { useState } from "react";
import { PageHeader } from "../components/ui/PageHeader";
import { Surface } from "../components/ui/Surface";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { cn } from "../utils/cn";
import { useAuth } from "../contexts/AuthContext";
import { usePortfolio } from "../data/PortfolioContext";
import { portfolioTotals } from "../data/selectors";
import {
  Bell,
  CalendarDays,
  Building2,
  IndianRupee,
  CalendarRange,
  CreditCard,
  User,
  Mail,
  ShieldCheck,
  Calendar,
  Layers,
  KeyRound,
  Users,
  Sparkles,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { Select, TextInput } from "../components/ui/Field";

function formatAccountDate(isoString?: string | null): string {
  if (!isoString) return "Active member";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "Active member";
    return d.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Active member";
  }
}

function InfoRow({
  icon: Icon,
  label,
  value,
  subvalue,
  isBadge,
  isEmail,
  isCapitalize,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  subvalue?: string;
  isBadge?: boolean;
  isEmail?: boolean;
  isCapitalize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 transition-colors hover:bg-white/60">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-muted)] text-[var(--color-ink-soft)] border border-[var(--color-line)]/50">
          <Icon className="size-3.5" />
        </div>
        <span className="truncate text-[12.5px] font-medium text-[var(--color-ink-soft)]">
          {label}
        </span>
      </div>
      <div className="text-right shrink-0 max-w-[55%]">
        {isBadge ? (
          <span className="inline-flex items-center rounded-md bg-[var(--color-surface-muted)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-ink)] border border-[var(--color-line)]/70">
            {value}
          </span>
        ) : (
          <div
            className={cn(
              "text-[13px] font-semibold text-[var(--color-ink)] truncate",
              isEmail && "font-normal text-[12px]",
              isCapitalize && "capitalize"
            )}
            title={typeof value === "string" ? value : undefined}
          >
            {value}
          </div>
        )}
        {subvalue && (
          <div className="text-[11px] font-medium text-[var(--color-accent)]">
            {subvalue}
          </div>
        )}
      </div>
    </div>
  );
}

function Toggle({ defaultOn, label }: { defaultOn?: boolean; label: string }) {
  const [on, setOn] = useState(!!defaultOn);
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => setOn((v) => !v)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 cursor-pointer shadow-inner focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2",
        on ? "bg-gradient-to-r from-[var(--color-accent)] to-[#be7055]" : "bg-[var(--color-line-strong)]"
      )}
    >
      <span
        className={cn(
          "absolute top-[2px] left-[2px] size-5 rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.2)] transition-transform duration-300 ease-in-out",
          on ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

function SettingRow({
  icon: Icon,
  title,
  desc,
  control,
  isLast,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  control: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <div
      className={cn(
        "group flex items-start justify-between gap-3 p-4.5 transition-all duration-200 hover:bg-white/60 sm:items-center sm:gap-4",
        !isLast && "border-b border-white/60"
      )}
    >
      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
        <div className="mt-0.5 text-[var(--color-ink-faint)]">
          <Icon className="size-[18px] stroke-[1.8]" />
        </div>
        <div>
          <div className="text-[14px] font-medium text-[var(--color-ink)] transition-colors group-hover:text-[var(--color-ink-strong)]">
            {title}
          </div>
          <div className="mt-0.5 text-[13px] text-[var(--color-ink-soft)]">
            {desc}
          </div>
        </div>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

export default function Settings() {
  const { user, profile, updateProfile } = useAuth();
  const { properties, units, tenants } = usePortfolio();
  const totals = portfolioTotals(properties, units, tenants);

  const userName = profile?.full_name || user?.email || "Portfolio Owner";
  const userEmail = user?.email || "";
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(profile?.full_name || "");
  const [isSavingName, setIsSavingName] = useState(false);

  const handleSaveName = async () => {
    const trimmed = editedName.trim();
    if (!trimmed) return;
    setIsSavingName(true);
    try {
      await updateProfile({ full_name: trimmed });
      setIsEditingName(false);
    } catch (err) {
      console.error("Failed to update name:", err);
    } finally {
      setIsSavingName(false);
    }
  };

  const [editingRentRules, setEditingRentRules] = useState(false);
  const [isSavingRules, setIsSavingRules] = useState(false);
  
  const [method, setMethod] = useState<"prepaid" | "postpaid" | null>(profile?.rent_collection_method || "prepaid");
  const [dueDay, setDueDay] = useState(profile?.default_due_day?.toString() || "1");
  const [gracePeriod, setGracePeriod] = useState(profile?.grace_period_days?.toString() || "5");

  const saveRentRules = async () => {
    if (!method) return;
    const day = parseInt(dueDay, 10);
    const grace = parseInt(gracePeriod, 10);
    if (isNaN(day) || day < 1 || day > 31) return;
    if (isNaN(grace) || grace < 0) return;
    
    setIsSavingRules(true);
    try {
      await updateProfile({
        rent_collection_method: method,
        default_due_day: day,
        grace_period_days: grace,
      });
      setEditingRentRules(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSavingRules(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-10">
      <PageHeader
        eyebrow="ACCOUNT"
        title="Settings"
        description="Manage your profile, preferences, and notifications."
      />

      <div className="grid gap-6 lg:grid-cols-[4.8fr_6.2fr] items-start">
        {/* Profile & Account Information Card */}
        <Surface elevated className="overflow-hidden p-5 sm:p-7 space-y-6">
          {/* Top Profile Header */}
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <Avatar name={userName} size="lg" className="size-20 text-xl shadow-md border-2 border-white/80" />
              <div
                className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-[var(--color-surface)] shadow-xs border border-[var(--color-line)] text-[var(--color-accent)]"
                title="Verified Account"
              >
                <ShieldCheck className="size-3.5" />
              </div>
            </div>
            <div className="mt-4">
              <h2 className="text-lg font-bold tracking-tight text-[var(--color-ink)]">
                {userName}
              </h2>
              <p className="mt-0.5 text-[13px] text-[var(--color-ink-soft)] truncate max-w-[260px]">
                {userEmail}
              </p>
              <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-[11px] font-semibold text-[var(--color-ink-strong)] border border-[var(--color-line)]/70 shadow-2xs">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Portfolio Owner
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-[var(--color-line)]/70" />

          {/* Account Information Sections */}
          <div className="space-y-5">
            <div className="border-b border-[var(--color-line)]/60 pb-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-faint)] flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-[var(--color-accent)]" />
                Account Information
              </h3>
            </div>

            {/* 1. Personal Information */}
            <div className="space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-faint)]">
                Personal Information
              </div>
              <div className="rounded-xl border border-[var(--color-line)]/70 bg-white/40 divide-y divide-[var(--color-line)]/50 overflow-hidden shadow-2xs">
                {isEditingName ? (
                  <div className="flex items-center justify-between gap-2 px-3.5 py-2 transition-colors bg-white/70">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-muted)] text-[var(--color-ink-soft)] border border-[var(--color-line)]/50">
                        <User className="size-3.5" />
                      </div>
                      <span className="truncate text-[12.5px] font-medium text-[var(--color-ink-soft)]">
                        Full name
                      </span>
                    </div>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveName();
                      }}
                      className="flex items-center gap-1.5"
                    >
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="h-7 w-32 sm:w-44 rounded-md border border-[var(--color-accent)] bg-white px-2 text-[13px] font-medium text-[var(--color-ink)] shadow-2xs focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                        placeholder="Full name"
                        autoFocus
                        disabled={isSavingName}
                      />
                      <button
                        type="submit"
                        disabled={isSavingName || !editedName.trim()}
                        className="inline-flex size-7 items-center justify-center rounded-md bg-[var(--color-accent)] text-white shadow-2xs hover:bg-[#8f4a33] disabled:opacity-50 transition-colors cursor-pointer"
                        title="Save name"
                      >
                        <Check className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isSavingName}
                        onClick={() => {
                          setEditedName(profile?.full_name || userName);
                          setIsEditingName(false);
                        }}
                        className="inline-flex size-7 items-center justify-center rounded-md border border-[var(--color-line)] bg-white/80 text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-muted)] transition-colors cursor-pointer"
                        title="Cancel"
                      >
                        <X className="size-3.5" />
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 transition-colors hover:bg-white/60">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-muted)] text-[var(--color-ink-soft)] border border-[var(--color-line)]/50">
                        <User className="size-3.5" />
                      </div>
                      <span className="truncate text-[12.5px] font-medium text-[var(--color-ink-soft)]">
                        Full name
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[13px] font-semibold text-[var(--color-ink)] truncate max-w-[140px] sm:max-w-[190px]">
                        {userName}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditedName(profile?.full_name || userName);
                          setIsEditingName(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink-strong)] hover:bg-[var(--color-surface-muted)] transition-all cursor-pointer border border-transparent hover:border-[var(--color-line)]"
                        title="Edit name"
                      >
                        <Pencil className="size-3 text-[var(--color-accent)]" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                )}
                <InfoRow icon={Mail} label="Registered email" value={userEmail || "Not provided"} isEmail />
                <InfoRow icon={ShieldCheck} label="Account role" value="Portfolio Owner" isBadge />
                <InfoRow icon={Calendar} label="Member since" value={formatAccountDate(user?.created_at)} />
              </div>
            </div>

            {/* 2. Portfolio Information */}
            <div className="space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-faint)]">
                Portfolio Information
              </div>
              <div className="rounded-xl border border-[var(--color-line)]/70 bg-white/40 divide-y divide-[var(--color-line)]/50 overflow-hidden shadow-2xs">
                <InfoRow icon={Building2} label="Total properties" value={`${totals.properties} ${totals.properties === 1 ? "property" : "properties"}`} />
                <InfoRow icon={Layers} label="Total units" value={`${totals.units} units`} />
                <InfoRow
                  icon={KeyRound}
                  label="Occupied units"
                  value={`${totals.occupied} units`}
                  subvalue={totals.units > 0 ? `${Math.round(totals.occupancy)}% occupancy` : undefined}
                />
                <InfoRow icon={Users} label="Active tenants" value={`${tenants.length} tenants`} />
              </div>
            </div>
          </div>
        </Surface>

        {/* Preferences and Portfolio */}
        <div className="space-y-6">
          <Surface elevated className="overflow-hidden">
            <div className="border-b border-[var(--color-line)] bg-[var(--color-surface-muted)]/50 px-5 py-4 sm:px-6">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-faint)]">
                NOTIFICATIONS
              </h2>
            </div>
            <div className="flex flex-col">
              <SettingRow
                icon={Bell}
                title="Email notifications"
                desc="Rent received, overdue, and lease alerts"
                control={<Toggle label="Email notifications" defaultOn />}
              />
              <SettingRow
                icon={CalendarDays}
                title="Weekly summary"
                desc="A digest every Monday morning"
                control={<Toggle label="Weekly summary" defaultOn />}
              />
              <SettingRow
                icon={Building2}
                title="Vacancy alerts"
                desc="Notify when a unit becomes available"
                control={<Toggle label="Vacancy alerts" />}
                isLast
              />
            </div>
          </Surface>

          <Surface elevated className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-surface-muted)]/50 px-5 py-3 sm:px-6">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-faint)]">
                RENT COLLECTION
              </h2>
              {!editingRentRules ? (
                <Button variant="ghost" size="sm" onClick={() => setEditingRentRules(true)}>
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditingRentRules(false)} disabled={isSavingRules}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={saveRentRules} disabled={isSavingRules}>
                    {isSavingRules ? "Saving..." : "Save"}
                  </Button>
                </div>
              )}
            </div>
            
            {editingRentRules ? (
              <div className="space-y-4 p-5 sm:p-6 text-[14px]">
                <p className="mb-4 text-[13px] text-[var(--color-ink-soft)]">
                  Changing these defaults affects future billing rules. Existing payment records are not automatically modified.
                </p>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-[12.5px] font-semibold text-[var(--color-ink-strong)]">Collection Method</label>
                    <Select value={method || "prepaid"} onChange={(e) => setMethod(e.target.value as "prepaid" | "postpaid")}>
                      <option value="prepaid">Prepaid</option>
                      <option value="postpaid">Postpaid</option>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[12.5px] font-semibold text-[var(--color-ink-strong)]">Default Due Day</label>
                    <Select value={dueDay} onChange={(e) => setDueDay(e.target.value)}>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <option key={day} value={day}>
                          {day}{[1, 21, 31].includes(day) ? "st" : [2, 22].includes(day) ? "nd" : [3, 23].includes(day) ? "rd" : "th"}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-[12.5px] font-semibold text-[var(--color-ink-strong)]">Grace Period (Days)</label>
                    <TextInput type="number" min="0" max="31" value={gracePeriod} onChange={(e) => setGracePeriod(e.target.value)} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                <SettingRow
                  icon={CreditCard}
                  title="Collection Method"
                  desc={profile?.rent_collection_method === "prepaid" ? "Prepaid (before/at start of period)" : profile?.rent_collection_method === "postpaid" ? "Postpaid (after rental period)" : "Not configured"}
                  control={<span className="text-[14px] font-semibold text-[var(--color-ink)] capitalize">{profile?.rent_collection_method || "None"}</span>}
                />
                <SettingRow
                  icon={CalendarDays}
                  title="Default Due Day"
                  desc="Payment deadline for new obligations"
                  control={<span className="text-[14px] font-semibold text-[var(--color-ink)]">Day {profile?.default_due_day || "1"}</span>}
                />
                <SettingRow
                  icon={Bell}
                  title="Grace Period"
                  desc="Days before marked overdue"
                  control={<span className="text-[14px] font-semibold text-[var(--color-ink)]">{profile?.grace_period_days || "0"} days</span>}
                  isLast
                />
              </div>
            )}
          </Surface>

          <Surface elevated className="overflow-hidden">
            <div className="border-b border-[var(--color-line)] bg-[var(--color-surface-muted)]/50 px-5 py-4 sm:px-6">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-faint)]">
                PORTFOLIO
              </h2>
            </div>
            <div className="flex flex-col">
              <SettingRow
                icon={IndianRupee}
                title="Default currency"
                desc="Used across statements and reports"
                control={
                  <span className="text-[14px] font-semibold text-[var(--color-ink)]">
                    INR (₹)
                  </span>
                }
              />
              <SettingRow
                icon={CalendarRange}
                title="Fiscal year start"
                desc="For annual reporting"
                control={
                  <span className="text-[14px] font-semibold text-[var(--color-ink)]">
                    April
                  </span>
                }
                isLast
              />
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}
