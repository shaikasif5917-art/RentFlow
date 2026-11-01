import { NavLink } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import { cn } from "../../utils/cn";
import { mobileNav } from "./navConfig";
import { usePortfolio } from "../../data/PortfolioContext";

export function MobileNavigation({ onMore }: { onMore: () => void }) {
  const { tenants } = usePortfolio();
  const unpaidCount = tenants.filter((t) => t.status === "active" && t.state !== "paid").length;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 w-full border-t border-[var(--color-line)] bg-[var(--color-surface)]/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md lg:hidden">
      <div className="mx-auto flex w-full max-w-lg items-stretch justify-around px-1.5 py-1 sm:px-3 sm:py-1.5">
        {mobileNav.map((item) => {
          const Icon = item.icon;
          const badge = item.to === "/payments" && unpaidCount > 0 ? unpaidCount.toString() : item.badge;
          
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "relative flex flex-1 min-w-0 flex-col items-center justify-center gap-0.5 sm:gap-1 rounded-[10px] px-1 py-1.5 sm:px-2 sm:py-2 text-[10px] sm:text-[10.5px] font-medium transition-colors",
                  isActive ? "text-[var(--color-ink)]" : "text-[var(--color-ink-faint)]",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <Icon className="size-[20px] sm:size-[21px] stroke-[1.7]" />
                    {badge && (
                      <span className="absolute -right-1.5 -top-1 flex size-[15px] items-center justify-center rounded-full bg-[var(--color-accent)] text-[9px] font-bold text-white">
                        {badge}
                      </span>
                    )}
                  </span>
                  <span className="truncate max-w-full text-center leading-tight">{item.label}</span>
                  {isActive && (
                    <span className="absolute -bottom-0.5 h-[3px] w-5 sm:w-6 rounded-full bg-[var(--color-accent)]" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
        <button
          type="button"
          onClick={onMore}
          className="flex flex-1 min-w-0 flex-col items-center justify-center gap-0.5 sm:gap-1 rounded-[10px] px-1 py-1.5 sm:px-2 sm:py-2 text-[10px] sm:text-[10.5px] font-medium text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] transition-colors cursor-pointer"
        >
          <MoreHorizontal className="size-[20px] sm:size-[21px] stroke-[1.7]" />
          <span className="truncate max-w-full text-center leading-tight">More</span>
        </button>
      </div>
    </nav>
  );
}
