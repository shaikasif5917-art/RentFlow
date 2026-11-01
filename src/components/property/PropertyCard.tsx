import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { Property } from "../../data/types";
import { formatPercent, plural, stateLabel, unitBreakdown, type PropertyMetrics } from "../../data/selectors";
import { currency, propertyStateTone } from "../../utils/format";
import type { Unit } from "../../data/types";
import { PropertyThumbnail } from "../ui/PropertyThumbnail";
import { StateText } from "../ui/StateText";
import { UnitStrip } from "./UnitStrip";
import { getPropertyImage } from "../../utils/propertyImages";

export interface PropertyRowData {
  property: Property;
  units: Unit[];
  metrics: PropertyMetrics;
}

function rentFigure(m: PropertyMetrics) {
  return m.expected > 0
    ? { value: m.expected, label: "/ month" }
    : { value: m.potential, label: "potential / month" };
}

/** Editorial grid item — image first, typography does the rest. */
export function PropertyCard({ data, index }: { data: PropertyRowData; index?: number }) {
  const { property: p, units, metrics: m } = data;
  const rent = rentFigure(m);
  const imageUrl = getPropertyImage(p, index);

  return (
    <Link
      to={`/properties/${p.id}`}
      className="group/card block rounded-[20px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ink)]/15 focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--color-canvas)]"
    >
      <article className="overflow-hidden rounded-[20px] border border-white/60 bg-white/50 p-3.5 backdrop-blur-md shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-white/95 hover:bg-white/85 hover:shadow-[var(--shadow-lift)]">
        <PropertyThumbnail
          src={imageUrl}
          alt={`${p.name}, ${p.locality}`}
          ratio="landscape"
          interactive
          className="rounded-[14px] shadow-[0_1px_2px_rgba(28,27,25,0.05)] transition-all duration-500 group-hover/card:scale-[1.02]"
        />

        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-[16.5px] font-semibold tracking-[-0.015em] text-[var(--color-ink)] break-words">
              {p.name}
            </h3>
            <p className="mt-0.5 truncate text-[13px] text-[var(--color-ink-soft)]">
              {p.locality}, {p.city} <span className="text-[var(--color-ink-faint)]">·</span> {p.type}
            </p>
          </div>
          <StateText tone={propertyStateTone(m.state)} className="mt-1">
            {stateLabel[m.state]}
          </StateText>
        </div>

        <UnitStrip units={units} className="mt-4" />

        <div className="mt-3.5 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="tabular text-[13.5px] font-medium text-[var(--color-ink)]">{plural(m.total, "unit")}</div>
            <div className="mt-0.5 truncate text-[12.5px] text-[var(--color-ink-soft)]">
              {m.total === 0 ? "No units yet" : unitBreakdown(m)}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="tabular text-[19px] font-semibold leading-none tracking-[-0.02em] text-[var(--color-ink)]">
              {currency(rent.value)}
            </div>
            <div className="mt-1 text-[11.5px] text-[var(--color-ink-faint)]">{rent.label}</div>
          </div>
        </div>

        {m.outstanding > 0 && (
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--color-line)] pt-3 text-[12.5px]">
            <span className="text-[var(--color-critical)] truncate min-w-0">
              <span className="tabular font-medium">{currency(m.outstanding)}</span>{" "}
              {m.overdueCount > 0 ? "overdue" : "due this month"}
            </span>
            <ChevronRight className="size-4 stroke-[1.7] text-[var(--color-ink-faint)] transition-transform duration-200 group-hover/card:translate-x-0.5" />
          </div>
        )}
        {m.outstanding === 0 && m.occupied > 0 && (
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--color-line)] pt-3 text-[12.5px] text-[var(--color-ink-faint)]">
            <span className="truncate min-w-0">
              All rent collected · <span className="tabular">{formatPercent(m.occupancy)}</span> occupied
            </span>
            <ChevronRight className="size-4 stroke-[1.7] transition-transform duration-200 group-hover/card:translate-x-0.5" />
          </div>
        )}
        {m.occupied === 0 && (
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--color-line)] pt-3 text-[12.5px] text-[var(--color-ink-faint)]">
            <span className="truncate min-w-0">{m.total === 0 ? "Add units to begin" : "Awaiting first tenant"}</span>
            <ChevronRight className="size-4 stroke-[1.7] transition-transform duration-200 group-hover/card:translate-x-0.5" />
          </div>
        )}
      </article>
    </Link>
  );
}
