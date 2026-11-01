import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MoreHorizontal, Copy, Check, ArrowUpRight } from "lucide-react";

/* --- Types --- */
export interface CarouselCard {
  id: string;
  title: string;
  value: string;
  mainValue?: string;
  unitSuffix?: string;
  subtitle?: string;
  trend?: string;
  substatus?: string;
  progress?: {
    value: number;
    label?: string;
  };
  color: string;
  icon: React.ElementType;
  badge?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: (card: CarouselCard) => void;
}

interface MinimalCarouselProps {
  cards: CarouselCard[];
  defaultActiveId?: string | null;
  onCopyClick?: (card: CarouselCard) => void;
  onCustomizeClick?: (card: CarouselCard) => void;
  className?: string;
}

export const MinimalCarousel: React.FC<MinimalCarouselProps> = ({
  cards,
  defaultActiveId = "collected",
  onCopyClick,
  onCustomizeClick,
  className = "",
}) => {
  const [activeId, setActiveId] = useState<string | null>(defaultActiveId);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeCard = cards.find((c) => c.id === activeId);
  const secondaryCards = cards.filter((c) => c.id !== activeId);

  const handleCopy = (card: CarouselCard, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText?.(`${card.title}: ${card.value}${card.subtitle ? ` (${card.subtitle})` : ""}`);
    setCopiedId(card.id);
    setTimeout(() => setCopiedId(null), 2000);
    onCopyClick?.(card);
  };

  const handleAction = (card: CarouselCard, e: React.MouseEvent) => {
    e.stopPropagation();
    if (card.onAction) {
      card.onAction(card);
    } else if (card.actionHref) {
      window.location.hash = card.actionHref;
    }
    onCustomizeClick?.(card);
  };

  return (
    <div className={`w-full font-sans select-none ${className}`}>
      <motion.div layout className="flex flex-col gap-2.5 sm:gap-3">
        {/* Expanded Hero Card */}
        <AnimatePresence mode="popLayout">
          {activeCard && (
            <motion.div
              key={activeCard.id}
              layoutId={activeCard.id}
              className={`relative flex w-full flex-col justify-between overflow-hidden
                         rounded-[24px] sm:rounded-[32px] p-4.5 sm:p-7 text-white shadow-lg sm:shadow-2xl
                         ${activeCard.color}
                         min-h-[160px] sm:min-h-[200px]`}
              transition={{ type: "spring", bounce: 0.18, duration: 0.55 }}
            >
              {/* Decorative background glow */}
              <div className="pointer-events-none absolute -right-10 -bottom-10 size-48 rounded-full bg-white/10 blur-2xl" />

              {/* Header row */}
              <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="flex size-10 sm:size-13 items-center justify-center rounded-xl sm:rounded-2xl bg-white/15 backdrop-blur-md shrink-0 shadow-inner">
                    <activeCard.icon className="size-5 sm:size-7 text-white" />
                  </div>
                  {activeCard.badge && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold backdrop-blur-md">
                      <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {activeCard.badge}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <motion.button
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    type="button"
                    onClick={(e) => handleCopy(activeCard, e)}
                    className="flex items-center gap-1.5 rounded-full bg-white/15 hover:bg-white/25
                               px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-[13px] font-semibold backdrop-blur-md 
                               text-white transition-all cursor-pointer shadow-sm active:scale-95"
                    title="Copy details"
                  >
                    {copiedId === activeCard.id ? (
                      <>
                        <Check className="size-3.5 text-emerald-300" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5 opacity-80" />
                        <span>Copy</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Body & Action row */}
              <div className="relative z-10 mt-3 sm:mt-5">
                <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4">
                  <div className="overflow-hidden pr-2">
                    <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-white/70">
                      {activeCard.title}
                    </p>
                    <div className="mt-0.5 flex items-baseline gap-1.5 flex-wrap">
                      <h3 className="text-2xl sm:text-4xl lg:text-[2.6rem] font-bold tracking-tight text-white leading-tight">
                        {activeCard.mainValue || activeCard.value}
                      </h3>
                      {activeCard.unitSuffix && (
                        <span className="text-base sm:text-2xl font-normal text-white/80">
                          {activeCard.unitSuffix}
                        </span>
                      )}
                    </div>

                    {activeCard.trend && (
                      <div className="mt-1 flex items-center gap-1.5 text-[12px] sm:text-[13.5px] font-medium text-white/90">
                        <ArrowUpRight className="size-3.5 sm:size-4 shrink-0 stroke-[2.5]" />
                        <span>{activeCard.trend}</span>
                      </div>
                    )}

                    {activeCard.subtitle && !activeCard.trend && (
                      <p className="mt-1 text-[11.5px] sm:text-[13.5px] font-medium text-white/80 leading-snug">
                        {activeCard.subtitle}
                      </p>
                    )}
                  </div>

                  {(activeCard.actionLabel || activeCard.actionHref || activeCard.onAction) && (
                    <button
                      type="button"
                      onClick={(e) => handleAction(activeCard, e)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/25 hover:bg-white/35
                                 px-3.5 py-1.5 sm:px-4 sm:py-2 text-[11.5px] sm:text-[13px] font-bold text-white backdrop-blur-md 
                                 transition-all shadow-md hover:shadow-lg active:scale-95 shrink-0 cursor-pointer"
                    >
                      <span>{activeCard.actionLabel || "View"}</span>
                      <ArrowUpRight className="size-3 sm:size-3.5 stroke-[2.5]" />
                    </button>
                  )}
                </div>

                {/* Optional Progress Bar (matching collection progress) */}
                {activeCard.progress && (
                  <div className="mt-3.5 sm:mt-5 pt-3 border-t border-white/15">
                    <div className="flex items-center justify-between text-[11px] sm:text-xs font-medium text-white/85 mb-1.5">
                      <span>{activeCard.progress.label || "Collection progress"}</span>
                      <span className="font-semibold">{activeCard.progress.value}%</span>
                    </div>
                    <div className="h-1.5 sm:h-2 w-full rounded-full bg-white/20 overflow-hidden backdrop-blur-sm">
                      <motion.div
                        className="h-full rounded-full bg-white shadow-sm"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.max(0, activeCard.progress.value))}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Secondary Cards Grid */}
        <motion.div
          layout
          className={`grid gap-2 sm:gap-3.5 transition-all duration-500 ${
            activeId ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-4"
          }`}
        >
          {(activeId ? secondaryCards : cards).map((card) => {
            const isThisCardActive = card.id === activeId;
            return (
              <motion.div
                key={card.id}
                layoutId={card.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveId(isThisCardActive ? null : card.id);
                }}
                transition={{ type: "spring", bounce: 0.18, duration: 0.55 }}
                className={`group relative flex flex-col justify-between cursor-pointer
                           rounded-[18px] sm:rounded-[24px] p-3 sm:p-4 text-white shadow-sm sm:shadow-lg
                           hover:shadow-xl transition-shadow overflow-hidden
                           ${card.color}
                           h-[110px] sm:h-32`}
              >
                {/* Subtle sheen */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10 opacity-60 group-hover:opacity-100 transition-opacity" />

                <div className="relative z-10 flex justify-between items-start">
                  <div className="flex size-7 sm:size-9 items-center justify-center rounded-lg sm:rounded-xl bg-white/15 backdrop-blur-sm">
                    <card.icon className="size-4 sm:size-5 text-white" />
                  </div>
                  {card.badge ? (
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] sm:text-[10.5px] font-semibold text-white backdrop-blur-sm">
                      {card.badge}
                    </span>
                  ) : (
                    <div className="rounded-full bg-white/10 p-1 sm:p-1.5 text-white/80 group-hover:bg-white/20 transition-colors">
                      <MoreHorizontal className="size-3 sm:size-4" />
                    </div>
                  )}
                </div>

                <div className="relative z-10 mt-1 overflow-hidden">
                  <h4 className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white/70 truncate leading-tight">
                    {card.title}
                  </h4>
                  <div className="mt-0.5 flex items-baseline gap-1">
                    <p className="text-[16px] sm:text-xl font-bold tracking-tight text-white truncate">
                      {card.mainValue || card.value}
                    </p>
                    {card.unitSuffix && (
                      <span className="text-[11px] sm:text-xs font-normal text-white/80 truncate">
                        {card.unitSuffix}
                      </span>
                    )}
                  </div>
                  {card.substatus && (
                    <p className="text-[9.5px] sm:text-[11px] font-medium text-white/80 truncate mt-0.5">
                      {card.substatus}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </div>
  );
};
