import { cn } from "../../utils/cn";

export function BrandMark({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="relative inline-flex size-9 items-center justify-center rounded-[10px] bg-[var(--color-ink)] text-white shadow-[var(--shadow-soft)]">
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 20V9l8-5 8 5v11" />
          <path d="M9 20v-6h6v6" />
        </svg>
      </span>
      {!compact && (
        <div className="flex flex-col leading-none">
          <span className="font-serif text-[17px] font-semibold tracking-[-0.01em] text-[var(--color-ink)]">
            RentFloww
          </span>
          <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--color-ink-faint)]">
            Property Management
          </span>
        </div>
      )}
    </div>
  );
}
