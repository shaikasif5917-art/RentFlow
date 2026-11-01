import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { plural, stateLabel, unitBreakdown } from "../../data/selectors";
import { currency, propertyStateTone } from "../../utils/format";
import { PropertyThumbnail } from "../ui/PropertyThumbnail";
import { StateText } from "../ui/StateText";
import { UnitStrip } from "./UnitStrip";
import type { PropertyRowData } from "./PropertyCard";
import { getPropertyImage } from "../../utils/propertyImages";

export const listGrid = "md:grid-cols-[minmax(0,2.3fr)_minmax(0,1.6fr)_minmax(0,1fr)_128px]";

/** Dense-but-calm list alternative to the grid. */
export function PropertyListRow({ data, index }: { data: PropertyRowData; index?: number }) {
  const { property: p, units, metrics: m } = data;
  const rent = m.expected > 0 ? m.expected : m.potential;
  const imageUrl = getPropertyImage(p, index);

  return (
    <Link
      to={`/properties/${p.id}`}
      className={`group/card grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3 rounded-[14px] px-4 py-4 outline-none transition-all duration-200 hover:bg-white/75 hover:shadow-[0_2px_12px_rgba(0,0,0,0.03)] focus-visible:bg-white/80 sm:px-5 ${listGrid}`}
    >
      {/* identity */}
      <div className="col-span-2 flex min-w-0 items-center gap-4 md:col-span-1">
        <PropertyThumbnail
          src={imageUrl}
          alt={p.name}
          ratio="landscape"
          interactive
          className="w-[92px] shrink-0 md:w-24"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-[var(--color-ink)]">{p.name}</h3>
            <StateText tone={propertyStateTone(m.state)} className="md:hidden">
              {stateLabel[m.state]}
            </StateText>
          </div>
          <p className="mt-0.5 truncate text-[12.5px] text-[var(--color-ink-soft)]">
            {p.locality}, {p.city} · {p.type}
          </p>
          <p className="mt-1.5 truncate text-[12px] text-[var(--color-ink-faint)] md:hidden">
            {plural(m.total, "unit")} · {m.total === 0 ? "no units yet" : unitBreakdown(m)}
          </p>
        </div>
      </div>

      {/* units */}
      <div className="hidden min-w-0 md:block">
        <div className="tabular text-[13.5px] font-medium text-[var(--color-ink)]">{plural(m.total, "unit")}</div>
        <UnitStrip units={units} className="my-2 max-w-[180px]" />
        <div className="truncate text-[12px] text-[var(--color-ink-soft)]">{m.total === 0 ? "No units yet" : unitBreakdown(m)}</div>
      </div>

      {/* rent */}
      <div className="col-span-2 flex items-baseline justify-between md:col-span-1 md:block md:text-right">
        <div className="md:hidden text-[12px] text-[var(--color-ink-faint)]">
          {m.expected > 0 ? "Monthly rent" : "Potential rent"}
        </div>
        <div>
          <div className="tabular text-[16px] font-semibold tracking-[-0.01em] text-[var(--color-ink)]">
            {currency(rent)}
          </div>
          {m.outstanding > 0 && (
            <div className="tabular mt-0.5 hidden text-[12px] text-[var(--color-critical)] md:block">
              {currency(m.outstanding)} {m.overdueCount > 0 ? "overdue" : "due"}
            </div>
          )}
        </div>
      </div>

      {/* state */}
      <div className="hidden items-center justify-end gap-3 md:flex">
        <StateText tone={propertyStateTone(m.state)}>{stateLabel[m.state]}</StateText>
        <ChevronRight className="size-4 stroke-[1.7] text-[var(--color-ink-faint)] transition-transform duration-200 group-hover/card:translate-x-0.5" />
      </div>
    </Link>
  );
}
