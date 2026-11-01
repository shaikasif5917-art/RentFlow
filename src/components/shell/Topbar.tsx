import { useState, useRef, useEffect, useMemo } from "react";
import { ArrowLeft, Bell, Command, AlertCircle, Clock, CheckCircle2, Wallet, KeyRound, ExternalLink, Check } from "lucide-react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { BrandMark } from "./BrandMark";
import { SearchField } from "../ui/SearchField";
import { Avatar } from "../ui/Avatar";
import { Dropdown } from "../ui/Dropdown";
import { useAuth } from "../../contexts/AuthContext";
import { useLocalTime } from "../../hooks/useLocalTime";
import { usePortfolio } from "../../data/PortfolioContext";
import { currency } from "../../utils/format";
import { cn } from "../../utils/cn";

export function Topbar({ onSignOut }: { onSignOut?: () => void }) {
  const { user, profile } = useAuth();
  const { formattedDate } = useLocalTime();
  const { tenants, activity } = usePortfolio();
  const navigate = useNavigate();
  const location = useLocation();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [markedReadAt, setMarkedReadAt] = useState<number>(() => {
    const saved = localStorage.getItem("rentflow_notifications_read_at");
    return saved ? parseInt(saved, 10) : 0;
  });

  const notifRef = useRef<HTMLDivElement>(null);

  // Close notifications popover on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    if (notificationsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationsOpen]);

  // Compute live notifications from tenants and activity
  const overdueTenants = useMemo(
    () => tenants.filter((t) => t.state === "overdue" && t.status === "active"),
    [tenants]
  );

  const dueTenants = useMemo(
    () => tenants.filter((t) => t.state === "due" && t.status === "active"),
    [tenants]
  );

  const recentActivity = useMemo(() => activity.slice(0, 5), [activity]);

  const totalAlertsCount = overdueTenants.length + dueTenants.length;
  const hasUnread = totalAlertsCount > 0 && markedReadAt < Date.now() - 3600000;

  const handleMarkAllRead = () => {
    const now = Date.now();
    setMarkedReadAt(now);
    localStorage.setItem("rentflow_notifications_read_at", String(now));
  };

  const handleBack = () => {
    const hasHistory = window.history.state && window.history.state.idx > 0;
    if (hasHistory) {
      navigate(-1);
    } else {
      navigate("/dashboard");
    }
  };

  const isDashboard = location.pathname === "/dashboard" || location.pathname === "/";

  return (
    <header className="sticky top-0 z-30 border-b border-[#cfe1b9]/75 bg-[#f4f7f0]/95 backdrop-blur-md shadow-[0_1px_3px_rgba(43,52,40,0.02)]">
      <div className="flex h-16 items-center gap-3 px-4 sm:gap-4 sm:px-8">
        {!isDashboard && (
          <button
            onClick={handleBack}
            className="flex lg:hidden size-[42px] shrink-0 items-center justify-center rounded-[12px] border border-[#cfe1b9] bg-white/80 text-[#2b3428] shadow-2xs backdrop-blur-md transition-all active:scale-95 active:bg-white"
            aria-label="Go back"
          >
            <ArrowLeft className="size-5 stroke-[1.8]" />
          </button>
        )}

        {/* Mobile brand */}
        <div className="lg:hidden">
          <BrandMark compact />
        </div>

        {/* Contextual date — desktop (styled in sage palette) */}
        <div className="hidden flex-col leading-tight lg:flex">
          <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#718355]">
            Today
          </span>
          <span className="tabular text-[13.5px] font-bold text-[#2b3428]">
            {formattedDate}
          </span>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
          <div className="hidden w-full max-w-sm md:block">
            <SearchField placeholder="Search properties, tenants…" shortcut="⌘K" />
          </div>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            title="Command menu"
            className="flex md:hidden size-9 items-center justify-center rounded-xl border border-[#cfe1b9] bg-white/70 text-[#414f3c] hover:bg-white cursor-pointer"
          >
            <Command className="size-4" />
          </button>

          {/* Interactive Notifications Bell & Popover */}
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen((prev) => !prev)}
              title="Notifications"
              aria-label="Notifications"
              className={cn(
                "relative flex size-9 sm:size-10 items-center justify-center rounded-xl border transition-all cursor-pointer",
                notificationsOpen
                  ? "border-[#718355] bg-[#e9f5db] text-[#2b3428] shadow-xs"
                  : "border-transparent text-[#414f3c] hover:border-[#cfe1b9] hover:bg-[#e9f5db]/70 hover:text-[#2b3428]"
              )}
            >
              <Bell className="size-[19px] stroke-[1.8]" />
              {hasUnread && (
                <span className="absolute right-2 top-2 size-2 rounded-full bg-[#a35a40] ring-2 ring-[#f4f7f0]" />
              )}
            </button>

            {/* Notification Dropdown Menu */}
            {notificationsOpen && (
              <div className="animate-sheet-in absolute right-0 z-50 mt-2 w-[340px] sm:w-[380px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[18px] border border-[#cfe1b9] bg-white/95 shadow-[0_20px_45px_-15px_rgba(43,52,40,0.18)] backdrop-blur-2xl">
                {/* Popover Header */}
                <div className="flex items-center justify-between border-b border-[#cfe1b9]/60 bg-[#f4f7f0]/80 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[14px] text-[#2b3428]">Notifications</span>
                    {totalAlertsCount > 0 && (
                      <span className="rounded-full bg-[#718355] px-2 py-0.5 text-[10.5px] font-bold text-white">
                        {totalAlertsCount}
                      </span>
                    )}
                  </div>
                  {hasUnread ? (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-[11.5px] font-semibold text-[#718355] hover:text-[#2b3428] hover:underline cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#718355]">
                      <Check className="size-3" /> All caught up
                    </span>
                  )}
                </div>

                {/* Popover Content Area */}
                <div className="max-h-[380px] overflow-y-auto divide-y divide-[#cfe1b9]/40">
                  {/* Urgent Overdue Section */}
                  {overdueTenants.length > 0 && (
                    <div className="bg-rose-50/40 p-2">
                      <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-800">
                        Attention Required ({overdueTenants.length})
                      </div>
                      {overdueTenants.map((t) => (
                        <Link
                          key={t.id}
                          to={`/tenants/${t.id}`}
                          onClick={() => setNotificationsOpen(false)}
                          className="flex items-start gap-3 rounded-[12px] p-2 transition-colors hover:bg-rose-100/60"
                        >
                          <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                            <AlertCircle className="size-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-bold text-[#2b3428] truncate">
                              Rent Overdue · {t.name}
                            </div>
                            <div className="text-[11.5px] text-[#414f3c] truncate">
                              {t.property} · {t.unit}
                            </div>
                            <div className="mt-0.5 text-[11.5px] font-semibold text-rose-700">
                              {currency(t.rent)} overdue
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Due Rent Reminders */}
                  {dueTenants.length > 0 && (
                    <div className="p-2">
                      <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-[#718355]">
                        Pending Collections ({dueTenants.length})
                      </div>
                      {dueTenants.slice(0, 3).map((t) => (
                        <Link
                          key={t.id}
                          to={`/tenants/${t.id}`}
                          onClick={() => setNotificationsOpen(false)}
                          className="flex items-start gap-3 rounded-[12px] p-2 transition-colors hover:bg-[#e9f5db]/60"
                        >
                          <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#e9f5db] text-[#5b6e4e]">
                            <Clock className="size-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-semibold text-[#2b3428] truncate">
                              Rent Due · {t.name}
                            </div>
                            <div className="text-[11.5px] text-[#414f3c] truncate">
                              {t.property} · {t.unit}
                            </div>
                            <div className="mt-0.5 text-[11.5px] font-semibold text-[#718355]">
                              {currency(t.rent)} due this cycle
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Recent Activity Stream */}
                  {recentActivity.length > 0 && (
                    <div className="p-2">
                      <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-[#718355]">
                        Recent Activity
                      </div>
                      {recentActivity.slice(0, 4).map((act) => {
                        const isPayment = act.type === "payment";
                        const isLease = act.type === "lease";
                        return (
                          <Link
                            key={act.id}
                            to={isPayment ? "/payments" : "/activity"}
                            onClick={() => setNotificationsOpen(false)}
                            className="flex items-start gap-3 rounded-[12px] p-2 transition-colors hover:bg-[#e9f5db]/60"
                          >
                            <div
                              className={cn(
                                "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg",
                                isPayment
                                  ? "bg-emerald-100 text-emerald-800"
                                  : isLease
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-[#e9f5db] text-[#5b6e4e]"
                              )}
                            >
                              {isPayment ? (
                                <Wallet className="size-4" />
                              ) : isLease ? (
                                <KeyRound className="size-4" />
                              ) : (
                                <CheckCircle2 className="size-4" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[12.5px] font-medium text-[#2b3428] truncate">
                                {act.title}
                              </div>
                              <div className="text-[11.5px] text-[#414f3c] truncate">
                                {act.detail}
                              </div>
                              <div className="text-[10.5px] text-[#718355]">
                                {act.time}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {/* Empty State */}
                  {overdueTenants.length === 0 && dueTenants.length === 0 && recentActivity.length === 0 && (
                    <div className="p-8 text-center">
                      <CheckCircle2 className="mx-auto size-8 text-[#718355]" />
                      <div className="mt-2 text-[13.5px] font-semibold text-[#2b3428]">All caught up</div>
                      <div className="text-[12px] text-[#414f3c]">No pending rent alerts or new notifications</div>
                    </div>
                  )}
                </div>

                {/* Popover Footer */}
                <div className="flex items-center justify-between border-t border-[#cfe1b9]/60 bg-[#f4f7f0]/80 px-4 py-2.5 text-[12px]">
                  <Link
                    to="/payments"
                    onClick={() => setNotificationsOpen(false)}
                    className="font-semibold text-[#718355] hover:text-[#2b3428] hover:underline"
                  >
                    View payments
                  </Link>
                  <Link
                    to="/activity"
                    onClick={() => setNotificationsOpen(false)}
                    className="inline-flex items-center gap-1 font-semibold text-[#718355] hover:text-[#2b3428] hover:underline"
                  >
                    All activity <ExternalLink className="size-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="mx-1 hidden h-6 w-px bg-[#cfe1b9]/80 sm:block" />

          {/* User Avatar with Clean Dropdown (removed redundant Preferences) */}
          <Dropdown
            trigger={
              <Avatar
                name={profile?.full_name || user?.email || "User"}
                size="md"
                className="cursor-pointer bg-[#e9f5db] text-[#5b6e4e] ring-2 ring-[#b5c99a] font-bold hover:ring-[#718355] transition-all"
              />
            }
            items={[
              { label: "Account Settings", onClick: () => navigate("/settings") },
              { label: "Sign out", tone: "critical", onClick: onSignOut },
            ]}
          />
        </div>
      </div>
    </header>
  );
}
