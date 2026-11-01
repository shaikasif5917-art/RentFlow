import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, DoorOpen } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Surface } from "../components/ui/Surface";
import { Button } from "../components/ui/Button";
import { PropertyThumbnail } from "../components/ui/PropertyThumbnail";
import { StatusBadge } from "../components/ui/StatusBadge";
import { EmptyState } from "../components/ui/EmptyState";
import { AssignTenantModal } from "../components/property/UnitModals";
import { usePortfolio } from "../data/PortfolioContext";
import { plural } from "../data/selectors";
import { currency } from "../utils/format";
import { getPropertyImage } from "../utils/propertyImages";

export default function Vacant() {
  const { units, properties } = usePortfolio();
  const [renting, setRenting] = useState<{ propertyId: string; unitId: string } | null>(null);

  const open = units
    .filter((u) => u.status !== "occupied")
    .map((u) => ({ unit: u, property: properties.find((p) => p.id === u.propertyId)! }))
    .filter((r) => r.property)
    .sort((a, b) => (b.unit.vacantDays ?? 0) - (a.unit.vacantDays ?? 0));

  const potential = open.filter((r) => r.unit.status === "vacant").reduce((s, r) => s + r.unit.rent, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Attention"
        title="Vacancies"
        description={
          open.length > 0
            ? `${plural(open.length, "unit")} not earning · ${currency(potential)} potential monthly rent`
            : "Every unit is currently let."
        }
      />

      {open.length === 0 ? (
        <Surface className="border-dashed">
          <EmptyState icon={<CheckCircle2 />} title="No vacant units" description="All units are currently occupied." />
        </Surface>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {open.map(({ unit, property: p }, i) => (
            <Surface key={unit.id} elevated className="flex gap-3 p-3 sm:gap-4">
              <PropertyThumbnail src={getPropertyImage(p, i)} alt={p.name} ratio="square" className="w-24 shrink-0 sm:w-36" />
              <div className="flex min-w-0 flex-1 flex-col justify-between py-1 pr-1 sm:pr-2">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      to={`/properties/${p.id}`}
                      className="truncate text-[15px] font-semibold text-[var(--color-ink)] underline-offset-4 hover:underline"
                    >
                      {p.name}
                    </Link>
                    <StatusBadge tone={unit.status === "vacant" ? "warning" : "accent"} dot>
                      {unit.status === "vacant" ? "Vacant" : "Maintenance"}
                    </StatusBadge>
                  </div>
                  <p className="mt-0.5 text-[12.5px] text-[var(--color-ink-soft)]">
                    Unit {unit.number} · {unit.config} · {p.locality}
                  </p>
                  <p className="mt-2 text-[12.5px] font-medium text-[var(--color-warning)]">
                    {unit.status === "maintenance"
                      ? unit.maintenanceNote
                      : (unit.vacantDays ?? 0) === 0
                        ? "Just listed"
                        : `Vacant for ${plural(unit.vacantDays ?? 0, "day")}`}
                  </p>
                </div>
                <div className="mt-3 flex items-end justify-between gap-2">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">Asking rent</div>
                    <div className="tabular text-[16px] font-semibold text-[var(--color-ink)]">{currency(unit.rent)}/mo</div>
                  </div>
                  {unit.status === "vacant" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<DoorOpen />}
                      onClick={() => setRenting({ propertyId: p.id, unitId: unit.id })}
                    >
                      Mark rented
                    </Button>
                  )}
                </div>
              </div>
            </Surface>
          ))}
        </div>
      )}

      <AssignTenantModal
        open={!!renting}
        onClose={() => setRenting(null)}
        propertyId={renting?.propertyId ?? ""}
        unitId={renting?.unitId}
      />
    </div>
  );
}
