import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../../utils/cn";

interface SelectContextType {
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  selectedLabel?: ReactNode;
  setSelectedLabel: (label: ReactNode) => void;
  labelsMap: React.MutableRefObject<Map<string, ReactNode>>;
}

const SelectContext = createContext<SelectContextType | null>(null);

function useSelect() {
  const ctx = useContext(SelectContext);
  if (!ctx) {
    throw new Error("Select components must be used within a Select provider");
  }
  return ctx;
}

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export function Select({
  value: controlledValue,
  defaultValue,
  onValueChange,
  open: controlledOpen,
  onOpenChange,
  children,
}: SelectProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<ReactNode>(null);
  const labelsMap = useRef<Map<string, ReactNode>>(new Map());
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const isValueControlled = controlledValue !== undefined;
  const value = isValueControlled ? controlledValue : uncontrolledValue;

  const isOpenControlled = controlledOpen !== undefined;
  const open = isOpenControlled ? controlledOpen : uncontrolledOpen;

  const handleOpenChange = useCallback(
    (nextOpen: boolean | ((prev: boolean) => boolean)) => {
      const resolved = typeof nextOpen === "function" ? nextOpen(open) : nextOpen;
      if (!isOpenControlled) {
        setUncontrolledOpen(resolved);
      }
      onOpenChange?.(resolved);
    },
    [isOpenControlled, onOpenChange, open],
  );

  const handleValueChange = useCallback(
    (val: string) => {
      if (!isValueControlled) {
        setUncontrolledValue(val);
      }
      onValueChange?.(val);
      handleOpenChange(false);
    },
    [isValueControlled, onValueChange, handleOpenChange],
  );

  // Sync selected label when value changes
  useEffect(() => {
    if (value !== undefined && labelsMap.current.has(value)) {
      setSelectedLabel(labelsMap.current.get(value));
    }
  }, [value]);

  return (
    <SelectContext.Provider
      value={{
        value,
        onValueChange: handleValueChange,
        open,
        setOpen: handleOpenChange,
        triggerRef,
        selectedLabel,
        setSelectedLabel,
        labelsMap,
      }}
    >
      <div className="relative inline-block text-left">{children}</div>
    </SelectContext.Provider>
  );
}

export interface SelectTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  icon?: ReactNode;
  hideChevron?: boolean;
}

export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  SelectTriggerProps
>(({ className, children, icon, hideChevron = false, ...props }, ref) => {
  const { open, setOpen, triggerRef } = useSelect();

  const setMergedRef = useCallback(
    (node: HTMLButtonElement | null) => {
      triggerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref, triggerRef],
  );

  return (
    <button
      ref={setMergedRef}
      type="button"
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
      onClick={() => setOpen((prev) => !prev)}
      className={cn(
        "inline-flex items-center justify-between gap-2 rounded-xl border border-[#cfe1b9] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#2b3428] shadow-2xs transition-all duration-150 hover:bg-[#fbfdf9] hover:border-[#a3b899] focus:outline-none focus:ring-2 focus:ring-[#718355]/30 focus:border-[#718355] cursor-pointer active:scale-[0.99]",
        open && "ring-2 ring-[#718355]/30 border-[#718355] bg-[#fbfdf9]",
        className,
      )}
      {...props}
    >
      <span className="flex items-center gap-2 truncate text-left">{children}</span>
      {!hideChevron && (
        <span className="text-[#718355] transition-transform duration-200">
          {icon || (
            <ChevronDown
              className={cn("size-3.5 transition-transform duration-200", open && "rotate-180")}
            />
          )}
        </span>
      )}
    </button>
  );
});
SelectTrigger.displayName = "SelectTrigger";

export interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

export function SelectValue({ placeholder, className }: SelectValueProps) {
  const { selectedLabel, value } = useSelect();

  if (selectedLabel) {
    return <span className={cn("truncate", className)}>{selectedLabel}</span>;
  }

  if (value) {
    return <span className={cn("truncate", className)}>{value}</span>;
  }

  return (
    <span className={cn("truncate text-[var(--color-ink-faint)] font-normal", className)}>
      {placeholder || "Select an option"}
    </span>
  );
}

export interface SelectContentProps {
  children: ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  sideOffset?: number;
}

export function SelectContent({
  children,
  className,
  align = "left",
}: SelectContentProps) {
  const { open, setOpen, triggerRef } = useSelect();
  const contentRef = useRef<HTMLDivElement>(null);

  // Close on outside click or escape key, and scroll selected item into view on open
  useEffect(() => {
    if (!open) return;

    if (contentRef.current) {
      const selectedItem = contentRef.current.querySelector('[aria-selected="true"]');
      if (selectedItem) {
        requestAnimationFrame(() => {
          selectedItem.scrollIntoView({ block: "nearest" });
        });
      }
    }

    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        contentRef.current &&
        !contentRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, setOpen, triggerRef]);

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      role="listbox"
      className={cn(
        "animate-sheet-in absolute z-50 mt-1.5 max-h-[340px] min-w-[220px] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-[#cfe1b9] bg-white/95 p-1.5 shadow-[0_12px_32px_rgba(43,52,40,0.14)] backdrop-blur-xl transition-all duration-200 scrollbar-thin",
        align === "right" ? "right-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "left-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface SelectGroupProps {
  children: ReactNode;
  className?: string;
}

export function SelectGroup({ children, className }: SelectGroupProps) {
  return <div className={cn("py-1 first:pt-0 last:pb-0", className)}>{children}</div>;
}

export interface SelectLabelProps {
  children: ReactNode;
  className?: string;
}

export function SelectLabel({ children, className }: SelectLabelProps) {
  return (
    <div
      className={cn(
        "sticky top-0 z-10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#718355] bg-[#f7f9f4]/95 backdrop-blur-sm rounded-md mb-1 shadow-2xs border-b border-[#cfe1b9]/40",
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface SelectItemProps {
  value: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function SelectItem({
  value,
  children,
  className,
  disabled = false,
}: SelectItemProps) {
  const { value: selectedValue, onValueChange, labelsMap, setSelectedLabel } =
    useSelect();
  const isSelected = selectedValue === value;

  // Register label in map
  useEffect(() => {
    labelsMap.current.set(value, children);
    if (selectedValue === value) {
      setSelectedLabel(children);
    }
  }, [value, children, selectedValue, labelsMap, setSelectedLabel]);

  return (
    <div
      role="option"
      aria-selected={isSelected}
      aria-disabled={disabled}
      onClick={() => {
        if (!disabled) {
          onValueChange?.(value);
        }
      }}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center justify-between rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150 outline-none",
        isSelected
          ? "bg-[#e9f5db] text-[#2b3428] font-bold shadow-2xs"
          : "text-[#414f3c] hover:bg-[#f2f7ec] hover:text-[#2b3428]",
        disabled && "opacity-40 cursor-not-allowed pointer-events-none",
        className,
      )}
    >
      <span className="flex-1 truncate pr-2">{children}</span>
      {isSelected && (
        <Check className="size-4 shrink-0 text-[#718355] stroke-[2.5]" />
      )}
    </div>
  );
}
