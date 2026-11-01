import { useEffect } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";
import { IconButton } from "./IconButton";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  /** On desktop centered modal; on mobile it becomes an edge-to-edge bottom sheet */
  className?: string;
}

export function Modal({ open, onClose, title, description, children, footer, className }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      {/* Backdrop */}
      <div
        className="animate-fade-in absolute inset-0 bg-slate-950/40 backdrop-blur-[6px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet / Dialog Container */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "animate-sheet-in relative z-10 flex max-h-[92dvh] sm:max-h-[88vh] w-full max-w-lg flex-col overflow-hidden",
          "rounded-t-[28px] sm:rounded-[24px] border-t border-x sm:border border-white/80 bg-white/95 sm:bg-white/90",
          "backdrop-blur-2xl shadow-[var(--shadow-panel),0_10px_35px_rgba(0,0,0,0.15)]",
          className,
        )}
      >
        {/* Mobile pull-handle affordance */}
        <div className="flex w-full justify-center pt-2.5 pb-1 sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-black/15 active:bg-black/25" />
        </div>

        {/* Header */}
        {(title || description) && (
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-black/[0.06] sm:border-white/60 bg-white/60 px-4.5 py-3.5 sm:px-6 sm:py-5 backdrop-blur-md">
            <div className="space-y-0.5 sm:space-y-1 pr-2">
              {title && (
                <h2 className="text-[16px] sm:text-[18px] font-semibold tracking-[-0.01em] text-[var(--color-ink)] leading-snug">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-[12.5px] sm:text-[13px] text-[var(--color-ink-soft)] leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            <IconButton
              label="Close"
              onClick={onClose}
              className="-mr-1 -mt-0.5 size-9 sm:size-8 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors"
            >
              <X className="size-4.5 sm:size-4 text-[var(--color-ink-soft)]" />
            </IconButton>
          </div>
        )}

        {/* Content Body with smooth scroll and touch overscroll-contain */}
        {children && (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4.5 py-4 sm:px-6 sm:py-5">
            {children}
          </div>
        )}

        {/* Footer with full-width thumb action buttons on mobile */}
        {footer && (
          <div className="flex shrink-0 flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 border-t border-black/[0.06] sm:border-white/60 bg-white/60 px-4.5 py-3.5 sm:px-6 sm:py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4 backdrop-blur-md [&>*]:w-full sm:[&>*]:w-auto">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
