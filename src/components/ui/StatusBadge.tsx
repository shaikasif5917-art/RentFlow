import { cn } from "../../utils/cn";

type Tone = "positive" | "warning" | "critical" | "neutral" | "accent";

interface StatusBadgeProps {
  tone?: Tone;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

const tones: Record<Tone, { wrap: string; dot: string }> = {
  positive: {
    wrap: "bg-[#8c9a6e]/15 text-[#2b3428] border border-[#8c9a6e]/30 shadow-[0_1px_4px_rgba(140,154,110,0.12)] backdrop-blur-sm",
    dot: "bg-[#8c9a6e] shadow-[0_0_6px_rgba(140,154,110,0.7)] animate-pulse",
  },
  warning: {
    wrap: "bg-[#d8c4a8]/35 text-[#5e4b35] border border-[#d8c4a8]/60 shadow-[0_1px_4px_rgba(216,196,168,0.15)] backdrop-blur-sm",
    dot: "bg-[#c2883c] shadow-[0_0_6px_rgba(194,136,60,0.7)]",
  },
  critical: {
    wrap: "bg-[#a35a40]/15 text-[#a35a40] border border-[#a35a40]/30 shadow-[0_1px_4px_rgba(163,90,64,0.12)] backdrop-blur-sm",
    dot: "bg-[#a35a40] shadow-[0_0_6px_rgba(163,90,64,0.7)]",
  },
  neutral: {
    wrap: "bg-white/80 text-[var(--color-ink-soft)] border border-[var(--color-line)] shadow-[0_1px_4px_rgba(43,52,40,0.03)] backdrop-blur-sm",
    dot: "bg-[var(--color-ink-faint)]",
  },
  accent: {
    wrap: "bg-[var(--color-accent-wash)]/95 text-[var(--color-accent)] border border-[var(--color-accent)]/25 shadow-[0_1px_4px_rgba(163,90,64,0.1)] backdrop-blur-sm",
    dot: "bg-[var(--color-accent)] shadow-[0_0_6px_rgba(163,90,64,0.6)]",
  },
};

export function StatusBadge({ tone = "neutral", children, dot, className }: StatusBadgeProps) {
  const t = tones[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium tracking-[0.01em]",
        t.wrap,
        className,
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", t.dot)} />}
      {children}
    </span>
  );
}
