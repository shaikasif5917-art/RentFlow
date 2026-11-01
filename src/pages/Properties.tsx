import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDownUp, Building2, CheckCircle2, LayoutGrid, List, Plus, SearchX, Wrench } from "lucide-react";
import { usePortfolio } from "../data/PortfolioContext";
import { portfolioTotals, propertyMetrics, plural, type PropertyMetrics } from "../data/selectors";
import type { PropertyState } from "../data/types";
import { PageHeader } from "../components/ui/PageHeader";
import { Button } from "../components/ui/Button";
import { SearchField } from "../components/ui/SearchField";
import { Segmented } from "../components/ui/Segmented";
import { Dropdown } from "../components/ui/Dropdown";
import { EmptyState } from "../components/ui/EmptyState";
import { Surface } from "../components/ui/Surface";
import { PortfolioSummary } from "../components/property/PortfolioSummary";
import { PropertyCard, type PropertyRowData } from "../components/property/PropertyCard";
import { PropertyListRow, listGrid } from "../components/property/PropertyListRow";
import { PropertyFormModal } from "../components/property/PropertyFormModal";

type Filter = "all" | PropertyState;
type Sort = "name" | "rent" | "occupancy" | "vacancies";
type View = "grid" | "list";

const sortLabels: Record<Sort, string> = {
  name: "Name",
  rent: "Highest rent",
  occupancy: "Lowest occupancy",
  vacancies: "Most vacancies",
};

const sorters: Record<Sort, (a: PropertyRowData, b: PropertyRowData) => number> = {
  name: (a, b) => a.property.name.localeCompare(b.property.name),
  rent: (a, b) => b.metrics.expected + b.metrics.potential - (a.metrics.expected + a.metrics.potential),
  occupancy: (a, b) => a.metrics.occupancy - b.metrics.occupancy,
  vacancies: (a, b) => b.metrics.vacant - a.metrics.vacant,
};

const emptyCopy: Record<PropertyState, { icon: React.ReactNode; title: string; text: string }> = {
  occupied: {
    icon: <Building2 />,
    title: "No fully occupied properties",
    text: "Properties appear here once most of their units have tenants.",
  },
  vacant: {
    icon: <CheckCircle2 />,
    title: "No vacant properties",
    text: "Every property is well let. Individual vacant units are listed on the Vacancies page.",
  },
  maintenance: {
    icon: <Wrench />,
    title: "Nothing under maintenance",
    text: "No property has open repair work right now.",
  },
};

export default function Properties() {
  const navigate = useNavigate();
  const { properties, units, tenants, addProperty, isLoading } = usePortfolio();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("name");
  const [view, setView] = useState<View>("grid");
  const [adding, setAdding] = useState(false);

  const rows = useMemo<PropertyRowData[]>(
    () =>
      properties.map((property) => {
        const pu = units.filter((u) => u.propertyId === property.id);
        const metrics: PropertyMetrics = propertyMetrics(pu, tenants.filter((t) => t.propertyId === property.id));
        return { property, units: pu, metrics };
      }),
    [properties, units, tenants],
  );

  const totals = useMemo(() => portfolioTotals(properties, units, tenants), [properties, units, tenants]);

  const counts = useMemo(
    () => ({
      all: rows.length,
      occupied: rows.filter((r) => r.metrics.state === "occupied").length,
      vacant: rows.filter((r) => r.metrics.state === "vacant").length,
      maintenance: rows.filter((r) => r.metrics.state === "maintenance").length,
    }),
    [rows],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => filter === "all" || r.metrics.state === filter)
      .filter(
        (r) =>
          !q ||
          [r.property.name, r.property.locality, r.property.city, r.property.type, r.property.address]
            .join(" ")
            .toLowerCase()
            .includes(q),
      )
      .sort(sorters[sort]);
  }, [rows, query, filter, sort]);

  const clear = () => {
    setQuery("");
    setFilter("all");
  };

  return (
    <div className="space-y-5 sm:space-y-9 pb-24 sm:pb-0">
      <PageHeader
        eyebrow="Properties"
        title="Your rental portfolio"
        description={`${plural(totals.properties, "property", "properties")} · ${plural(totals.units, "unit")}`}
        actions={
          <Button size="sm" icon={<Plus />} onClick={() => setAdding(true)}>
            Add property
          </Button>
        }
      />

      {properties.length > 0 && <PortfolioSummary totals={totals} />}

      {isLoading && properties.length === 0 ? (
        <Surface className="border-dashed flex min-h-[400px] items-center justify-center text-[14px] text-[var(--color-ink-faint)]">
          Loading properties...
        </Surface>
      ) : properties.length === 0 ? (
        <Surface className="border-dashed">
          <EmptyState
            icon={<Building2 />}
            title="No properties yet"
            description="Add your first property to start tracking units, tenants and monthly rent in one place."
            action={
              <Button icon={<Plus />} onClick={() => setAdding(true)}>
                Add property
              </Button>
            }
          />
        </Surface>
      ) : (
        <section className="space-y-6">
          {/* controls */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <SearchField
                containerClassName="w-full sm:w-72"
                placeholder="Search properties"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search properties"
              />
              <div className="w-full overflow-x-auto pb-1 scrollbar-hide">
                <Segmented<Filter>
                  label="Filter by state"
                  value={filter}
                  onChange={setFilter}
                  options={[
                    { value: "all", label: "All", count: counts.all },
                    { value: "occupied", label: "Occupied", count: counts.occupied },
                    { value: "vacant", label: "Vacant", count: counts.vacant },
                    { value: "maintenance", label: "Maintenance", count: counts.maintenance },
                  ]}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
              <Dropdown
                align="left"
                menuClassName="left-0 sm:left-auto sm:right-0"
                trigger={
                  <span className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-[var(--color-line-strong)] bg-[var(--color-surface)] px-3.5 text-[13px] font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface-muted)]">
                    <ArrowDownUp className="size-4 stroke-[1.7] text-[var(--color-ink-faint)]" />
                    <span className="text-[var(--color-ink-faint)]">Sort</span>
                    {sortLabels[sort]}
                  </span>
                }
                items={(Object.keys(sortLabels) as Sort[]).map((s) => ({
                  label: sortLabels[s],
                  active: s === sort,
                  onClick: () => setSort(s),
                }))}
              />
              <Segmented<View>
                label="View"
                value={view}
                onChange={setView}
                options={[
                  { value: "grid", label: <LayoutGrid />, ariaLabel: "Grid view" },
                  { value: "list", label: <List />, ariaLabel: "List view" },
                ]}
                className="[&_button]:px-2.5"
              />
            </div>
          </div>

          {/* results */}
          {visible.length === 0 ? (
            <Surface className="border-dashed">
              {query.trim() ? (
                <EmptyState
                  icon={<SearchX />}
                  title={`No results for “${query.trim()}”`}
                  description="Check the spelling, or try a locality, property type or street name."
                  action={
                    <Button variant="secondary" size="sm" onClick={clear}>
                      Clear search
                    </Button>
                  }
                />
              ) : filter !== "all" ? (
                <EmptyState
                  icon={emptyCopy[filter].icon}
                  title={emptyCopy[filter].title}
                  description={emptyCopy[filter].text}
                  action={
                    <Button variant="secondary" size="sm" onClick={clear}>
                      Show all properties
                    </Button>
                  }
                />
              ) : null}
            </Surface>
          ) : view === "grid" ? (
            <div key="grid" className="animate-fade-rise grid gap-x-7 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((r, i) => (
                <PropertyCard key={r.property.id} data={r} index={i} />
              ))}
            </div>
          ) : (
            <Surface key="list" elevated className="animate-fade-rise overflow-hidden">
              <div
                className={`hidden gap-x-4 border-b border-[var(--color-line)] bg-[var(--color-surface-muted)] px-5 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-faint)] md:grid ${listGrid}`}
              >
                <span>Property</span>
                <span>Units</span>
                <span className="text-right">Monthly rent</span>
                <span className="text-right">State</span>
              </div>
              <div className="divide-y divide-[var(--color-line)]">
                {visible.map((r, i) => (
                  <PropertyListRow key={r.property.id} data={r} index={i} />
                ))}
              </div>
            </Surface>
          )}
        </section>
      )}

      <PropertyFormModal
        open={adding}
        onClose={() => setAdding(false)}
        mode="add"
        onAdd={async (input) => {
          const id = await addProperty(input);
          if (id) navigate(`/properties/${id}`);
        }}
      />
    </div>
  );
}
