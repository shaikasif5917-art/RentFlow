import { Search } from "lucide-react";
import type { InputHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

interface SearchFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  shortcut?: string;
  containerClassName?: string;
}

export function SearchField({
  className,
  containerClassName,
  shortcut,
  placeholder = "Search",
  ...props
}: SearchFieldProps) {
  return (
    <label
      className={cn(
        "group flex h-10 items-center gap-2.5 rounded-[12px] border border-[#cfe1b9]/80 bg-white/75 px-3.5 backdrop-blur-md shadow-[inset_0_1px_2px_rgba(0,0,0,0.02),0_1px_2px_rgba(255,255,255,0.7)] transition-all duration-200 hover:bg-white hover:border-[#97a97c] focus-within:border-[#718355] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#718355]/15 focus-within:shadow-[0_4px_14px_rgba(113,131,85,0.15)]",
        containerClassName,
      )}
    >
      <Search className="size-[17px] shrink-0 stroke-[1.8] text-[#718355] transition-colors group-focus-within:text-[#5b6e4e]" />
      <input
        placeholder={placeholder}
        className={cn(
          "w-full bg-transparent text-sm text-[var(--color-ink)] placeholder:text-[#97a97c] focus:outline-none",
          className,
        )}
        {...props}
      />
      {shortcut && (
        <kbd className="hidden shrink-0 rounded-md border border-[#cfe1b9] bg-[#e9f5db]/90 px-1.5 py-0.5 font-sans text-[10.5px] font-semibold text-[#718355] shadow-xs sm:inline-block">
          {shortcut}
        </kbd>
      )}
    </label>
  );
}
