import { ChevronDown } from "lucide-react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

const control =
  "w-full rounded-[12px] border border-white/70 bg-white/60 px-3.5 text-base sm:text-sm text-[var(--color-ink)] backdrop-blur-md shadow-[inset_0_1px_2px_rgba(0,0,0,0.02),0_1px_2px_rgba(255,255,255,0.7)] transition-all duration-200 placeholder:text-[var(--color-ink-faint)] hover:border-[var(--color-line-strong)] hover:bg-white/80 focus:border-[var(--color-accent)] focus:bg-white/95 focus:outline-none focus:ring-4 focus:ring-[var(--color-accent)]/15 focus:shadow-[0_4px_16px_rgba(163,90,64,0.14)] disabled:opacity-50";

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, hint, error, children, className }: FieldProps) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="flex items-baseline justify-between text-[12.5px] font-medium text-[var(--color-ink-soft)]">
        {label}
        {hint && <span className="text-[11.5px] font-normal text-[var(--color-ink-faint)]">{hint}</span>}
      </span>
      {children}
      {error && <span className="block text-[12px] font-medium text-[var(--color-critical)]">{error}</span>}
    </label>
  );
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, "min-h-[88px] resize-none py-3 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn(control, "h-11 appearance-none pr-9 cursor-pointer", className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 stroke-[1.8] text-[var(--color-ink-faint)] transition-colors" />
    </div>
  );
}

/** Quiet grouping heading inside forms */
export function FormGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-3.5">
      <legend className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}
