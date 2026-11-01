import { cn } from "../../utils/cn";
import { Surface } from "../ui/Surface";
import { formatPercent } from "../../data/selectors";
import { Building2, Layers, CheckCircle2, AlertCircle } from "lucide-react";

interface Totals {
  properties: number;
  units: number;
  occupied: number;
  vacant: number;
  maintenance: number;
  occupancy: number;
}

/** Composed portfolio summary — refined architectural executive metrics with multi-segment unit mix */
export function PortfolioSummary({ totals }: { totals: Totals }) {
  const { properties, units, occupied, vacant, maintenance, occupancy } = totals;
  const occupancyPct = Math.round(occupancy * 10) / 10;

  // Mix segments for the progress bar
  const totalUnits = units || 1;
  const occPct = (occupied / totalUnits) * 100;
  const vacPct = (vacant / totalUnits) * 100;
  const mntPct = (maintenance / totalUnits) * 100;

  return (
    <Surface
      elevated
      className="relative overflow-hidden rounded-[24px] sm:rounded-[28px] border border-white/80 bg-[var(--color-surface)]/90 backdrop-blur-xl p-5 sm:p-6 lg:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
    >
      {/* Decorative ambient background accents */}
      <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-[#8c9a6e]/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-12 -bottom-12 size-48 rounded-full bg-[#a35a40]/5 blur-3xl" />

      <div className="relative z-10 grid gap-6 lg:grid-cols-[auto_1px_1fr] lg:items-center lg:gap-8">
        
        {/* Left Section: Core Portfolio Scale (Properties & Units) */}
        <div className="flex items-center gap-6 sm:gap-8">
          {/* Properties */}
          <div className="flex items-center gap-3.5">
            <div className="flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-2xl bg-[#2b3428]/8 text-[#2b3428] border border-[#2b3428]/10 shadow-inner">
              <Building2 className="size-5 sm:size-6" />
            </div>
            <div>
              <span className="text-[10.5px] sm:text-[11.5px] font-bold uppercase tracking-wider text-[var(--color-ink-faint)]">
                Properties
              </span>
              <div className="mt-0.5 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-ink)]">
                  {properties}
                </span>
                <span className="text-[12px] sm:text-[13px] font-medium text-[var(--color-ink-soft)]">
                  active
                </span>
              </div>
            </div>
          </div>

          <div className="h-10 w-px bg-[var(--color-line)]" />

          {/* Units */}
          <div className="flex items-center gap-3.5">
            <div className="flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-2xl bg-[#8c9a6e]/15 text-[#5b6e4e] border border-[#8c9a6e]/20 shadow-inner">
              <Layers className="size-5 sm:size-6" />
            </div>
            <div>
              <span className="text-[10.5px] sm:text-[11.5px] font-bold uppercase tracking-wider text-[var(--color-ink-faint)]">
                Total Units
              </span>
              <div className="mt-0.5 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-ink)]">
                  {units}
                </span>
                <span className="text-[12px] sm:text-[13px] font-medium text-[var(--color-ink-soft)]">
                  units
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Divider */}
        <div className="hidden lg:block h-16 w-px bg-[var(--color-line)]" />

        {/* Right Section: Occupancy Breakdown & Dynamic Multi-Bar */}
        <div className="flex flex-col justify-center space-y-3.5 pt-4 border-t border-[var(--color-line)] lg:border-t-0 lg:pt-0">
          
          {/* Status Breakdown Pills/Metrics */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {/* Occupied */}
            <div className="rounded-xl border border-[var(--color-line)]/60 bg-white/50 px-3 py-2 sm:px-4 sm:py-2.5 transition-colors hover:bg-white/80">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#5b6e4e] shadow-[0_0_6px_rgba(91,110,78,0.5)]" />
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-faint)]">
                  Occupied
                </span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-ink)]">
                  {occupied}
                </span>
                <span className="text-[11px] sm:text-[12px] font-medium text-[#5b6e4e]">
                  {units > 0 ? `${Math.round((occupied / units) * 100)}%` : "0%"}
                </span>
              </div>
            </div>

            {/* Vacant */}
            <div className={cn(
              "rounded-xl border border-[var(--color-line)]/60 bg-white/50 px-3 py-2 sm:px-4 sm:py-2.5 transition-colors hover:bg-white/80",
              vacant > 0 && "bg-[#d8c4a8]/20 border-[#d8c4a8]/50"
            )}>
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "size-2 rounded-full",
                  vacant > 0 ? "bg-[#a35a40] animate-pulse" : "bg-[var(--color-ink-faint)]"
                )} />
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-faint)]">
                  Vacant
                </span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className={cn(
                  "text-xl sm:text-2xl font-bold tracking-tight",
                  vacant > 0 ? "text-[#a35a40]" : "text-[var(--color-ink)]"
                )}>
                  {vacant}
                </span>
                <span className="text-[11px] sm:text-[12px] font-medium text-[var(--color-ink-faint)]">
                  {units > 0 ? `${Math.round((vacant / units) * 100)}%` : "0%"}
                </span>
              </div>
            </div>

            {/* Maintenance */}
            <div className={cn(
              "rounded-xl border border-[var(--color-line)]/60 bg-white/50 px-3 py-2 sm:px-4 sm:py-2.5 transition-colors hover:bg-white/80",
              maintenance > 0 && "bg-[#a35a40]/10 border-[#a35a40]/30"
            )}>
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "size-2 rounded-full",
                  maintenance > 0 ? "bg-[#a35a40]" : "bg-[var(--color-ink-faint)]"
                )} />
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-faint)]">
                  Maintenance
                </span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className={cn(
                  "text-xl sm:text-2xl font-bold tracking-tight",
                  maintenance > 0 ? "text-[#a35a40]" : "text-[var(--color-ink)]"
                )}>
                  {maintenance}
                </span>
                <span className="text-[11px] sm:text-[12px] font-medium text-[var(--color-ink-faint)]">
                  {units > 0 ? `${Math.round((maintenance / units) * 100)}%` : "0%"}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar & Occupancy Summary */}
          <div className="space-y-1.5">
            <div className="h-2 sm:h-2.5 w-full rounded-full bg-[var(--color-line)]/60 p-0.5 overflow-hidden flex gap-0.5 shadow-inner">
              {units === 0 ? (
                <div className="h-full w-full rounded-full bg-[var(--color-line)]" />
              ) : (
                <>
                  {occPct > 0 && (
                    <div
                      style={{ width: `${occPct}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-[#5b6e4e] to-[#758a63] shadow-xs transition-all duration-500"
                      title={`Occupied: ${occupied} (${Math.round(occPct)}%)`}
                    />
                  )}
                  {vacPct > 0 && (
                    <div
                      style={{ width: `${vacPct}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-[#d8c4a8] to-[#bda688] shadow-xs transition-all duration-500"
                      title={`Vacant: ${vacant} (${Math.round(vacPct)}%)`}
                    />
                  )}
                  {mntPct > 0 && (
                    <div
                      style={{ width: `${mntPct}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-[#a35a40] to-[#8f4a33] shadow-xs transition-all duration-500"
                      title={`Maintenance: ${maintenance} (${Math.round(mntPct)}%)`}
                    />
                  )}
                </>
              )}
            </div>

            <div className="flex items-center justify-between text-[11.5px] sm:text-[12px]">
              <div className="flex items-center gap-1.5 font-medium text-[var(--color-ink-soft)]">
                <span className="font-semibold text-[var(--color-ink)]">
                  {formatPercent(occupancyPct)}
                </span>
                <span>of units occupied</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-medium">
                {occupancyPct >= 80 ? (
                  <span className="inline-flex items-center gap-1 text-[#5b6e4e]">
                    <CheckCircle2 className="size-3" />
                    <span>Healthy portfolio</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[#a35a40]">
                    <AlertCircle className="size-3" />
                    <span>Turnaround needed</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </Surface>
  );
}
