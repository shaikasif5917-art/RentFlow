import { useState } from "react";
import { PageHeader } from "../components/ui/PageHeader";
import { Surface } from "../components/ui/Surface";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { cn } from "../utils/cn";
import { useAuth } from "../contexts/AuthContext";
import {
  Bell,
  CalendarDays,
  Building2,
  IndianRupee,
  CalendarRange,
  CreditCard,
} from "lucide-react";
import { Select, TextInput } from "../components/ui/Field";

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
  const { user, profile } = useAuth();
  const userName = profile?.full_name || user?.email || "User";
  const userEmail = user?.email || "";
  const { updateProfile } = useAuth();
  
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

      <div className="grid gap-6 lg:grid-cols-[4fr_6.5fr] items-start">
        {/* Profile Card */}
        <Surface elevated className="overflow-hidden p-6 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <Avatar name={userName} size="lg" className="size-20 text-xl" />
            <div className="mt-5">
              <h2 className="text-lg font-semibold tracking-tight text-[var(--color-ink)]">
                {userName}
              </h2>
              <p className="mt-1 text-[13.5px] text-[var(--color-ink-soft)]">
                {userEmail}
              </p>
            </div>
          </div>
          
          <div className="mt-8 flex flex-col items-center space-y-3">
            <Button
              variant="secondary"
              className="w-full justify-center transition-all hover:bg-[var(--color-surface-muted)]"
            >
              Edit profile
            </Button>
            <p className="text-[12px] text-[var(--color-ink-faint)]">
              Profile editing will be available soon.
            </p>
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
