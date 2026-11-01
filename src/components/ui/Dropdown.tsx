import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

interface DropdownItem {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  tone?: "default" | "critical";
  active?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
  className?: string;
  menuClassName?: string;
}

export function Dropdown({ trigger, items, align = "right", className, menuClassName }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button onClick={() => setOpen((v) => !v)} className="block">
        {trigger}
      </button>
      {open && (
        <div
          className={cn(
            "animate-sheet-in absolute z-50 mt-2 min-w-[200px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[14px] border border-[#cfe1b9]/80 bg-white/95 p-1.5 shadow-[var(--shadow-panel)] backdrop-blur-2xl",
            align === "right" ? "right-0" : "left-0",
            menuClassName
          )}
        >
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => {
                item.onClick?.();
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2 text-left text-[13px] font-medium transition-all duration-150 cursor-pointer hover:bg-[#e9f5db] hover:text-[#2b3428]",
                item.tone === "critical"
                  ? "text-rose-700 hover:bg-rose-50"
                  : "text-[#414f3c]",
                "[&>svg]:size-[16px] [&>svg]:stroke-[1.7]",
              )}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.active && <Check className="!size-[15px] text-[#718355]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
