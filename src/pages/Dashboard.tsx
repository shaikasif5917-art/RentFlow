import { useMemo } from "react";
import { ArrowUpRight, Plus, TrendingUp, Wallet, Building2, Layers, PieChart, DoorOpen } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { SectionHeader } from "../components/ui/SectionHeader";
import { Surface } from "../components/ui/Surface";
import { Button } from "../components/ui/Button";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Divider } from "../components/ui/Divider";
import { Avatar } from "../components/ui/Avatar";
import { MinimalCarousel, type CarouselCard } from "../components/ui/MinimalCarousel";
import { Link } from "react-router-dom";
import { usePortfolio } from "../data/PortfolioContext";
import { portfolioTotals, getMonthlyTenantsSummary, unitLabel } from "../data/selectors";
import { currency, paymentLabel, paymentTone } from "../utils/format";
import { useAuth } from "../contexts/AuthContext";
import { useLocalTime } from "../hooks/useLocalTime";
import { getCurrentBillingMonth, type RentCollectionMethod } from "../utils/billing";

const stateOrder = { overdue: 0, due: 1, paid: 2 } as const;

export default function Dashboard() {
  const { profile } = useAuth();
  const userName = profile?.full_name || "Portfolio Owner";
  const { properties, units, tenants: allTenants, payments, activity: allActivity } = usePortfolio();

  const collectionMethod = (profile?.rent_collection_method as RentCollectionMethod) || "prepaid";
  const currentCalendarMonth = useMemo(() => getCurrentBillingMonth(new Date()), []);

  const currentSummary = useMemo(() => {
    return getMonthlyTenantsSummary(
      allTenants,
      currentCalendarMonth,
      payments,
      collectionMethod,
      profile?.default_due_day ?? 1,
      profile?.grace_period_days ?? 0,
      new Date(),
    );
  }, [allTenants, currentCalendarMonth, payments, collectionMethod, profile]);

  const totals = portfolioTotals(properties, units, allTenants, payments, currentCalendarMonth);

  const portfolioStats = {
    collected: currentSummary.collected,
    monthlyIncome: currentSummary.expected,
    properties: totals.properties,
    units: totals.units,
    occupancy: Math.round(totals.occupancy),
    vacant: totals.vacant,
  };

  const tenants = [...allTenants].sort((a, b) => stateOrder[a.state] - stateOrder[b.state]);
  const activity = allActivity.slice(0, 5);
  const { greeting, monthYear } = useLocalTime();
  const collectedPct = currentSummary.collectionRate;

  const portfolioCards: CarouselCard[] = [
    {
      id: "collected",
      title: "Collected this month",
      value: currency(portfolioStats.collected),
      mainValue: currency(portfolioStats.collected),
      trend: `${collectedPct}% of ${currency(portfolioStats.monthlyIncome)} expected`,
      progress: {
        value: collectedPct,
        label: "Collection progress",
      },
      color: "bg-[#2b3428]", // Deep Forest Pine (Image 2 - Primary anchor)
      textColor: "light",
      icon: Wallet,
      badge: collectedPct >= 100 ? "Completed" : collectedPct > 0 ? "On track" : "Pending",
      actionLabel: "View Payments",
      actionHref: "#/payments",
    },
    {
      id: "properties",
      title: "Properties",
      value: `${portfolioStats.properties} active`,
      mainValue: `${portfolioStats.properties}`,
      unitSuffix: "active",
      subtitle: `${totals.properties} managed properties in your portfolio`,
      color: "bg-[#414f3c]", // Deep Evergreen Olive (Image 2)
      textColor: "light",
      icon: Building2,
      actionLabel: "View Properties",
      actionHref: "#/properties",
    },
    {
      id: "units",
      title: "Total Units",
      value: `${portfolioStats.units}`,
      mainValue: `${portfolioStats.units}`,
      unitSuffix: "units",
      subtitle: `${totals.occupied} occupied · ${totals.vacant} vacant · ${totals.maintenance} maintenance`,
      color: "bg-[#8c9a6e]", // Sage Moss Green (Image 2)
      textColor: "light",
      icon: Layers,
      actionLabel: "Manage Units",
      actionHref: "#/properties",
    },
    {
      id: "occupancy",
      title: "Occupancy Rate",
      value: `${portfolioStats.occupancy}%`,
      mainValue: `${portfolioStats.occupancy}`,
      unitSuffix: "%",
      subtitle: totals.occupancy >= 80 ? "Healthy portfolio occupancy (≥80%)" : "Target occupancy: 90%+",
      color: "bg-[#5b6e4e]", // Earthy Forest Moss (Image 2)
      textColor: "light",
      icon: PieChart,
      actionLabel: "View Tenants",
      actionHref: "#/tenants",
    },
    {
      id: "vacant",
      title: "Vacant Units",
      value: `${portfolioStats.vacant}`,
      mainValue: `${portfolioStats.vacant}`,
      unitSuffix: "vacant",
      substatus: portfolioStats.vacant > 0 ? "Needs attention" : "All units leased",
      subtitle: portfolioStats.vacant > 0 ? "Requires attention · Unit turnaround needed" : "All units currently leased",
      color: "bg-[#a35a40]", // Terracotta Rust (Image 2)
      textColor: "light",
      icon: DoorOpen,
      actionLabel: "View Vacancies",
      actionHref: "#/vacant",
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-8 pb-16 sm:pb-0 w-full min-w-0">
      <PageHeader
        eyebrow="Portfolio overview"
        title={`${greeting}, ${userName}`}
        description={`A calm summary of your properties, collections, and activity for ${monthYear}.`}
        actions={
          <>
            <Button variant="secondary" size="sm" icon={<TrendingUp />} onClick={() => window.location.hash = '#/activity'}>
              Reports
            </Button>
            <Button size="sm" icon={<Plus />} onClick={() => window.location.hash = '#/properties'}>
              Add property
            </Button>
          </>
        }
      />

      {/* Minimal Carousel Metric Showcase */}
      <MinimalCarousel cards={portfolioCards} defaultActiveId="collected" />

      {/* Two-column secondary — recent tenants + activity */}
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2 w-full min-w-0">
        <Surface elevated className="min-w-0 overflow-hidden">
          <div className="px-4 pt-4 sm:px-5 sm:pt-5">
            <SectionHeader
              title="Rent status"
              count={tenants.length}
              action={
                <Button variant="ghost" size="sm" iconRight={<ArrowUpRight />} onClick={() => window.location.hash = '#/tenants'}>
                  All
                </Button>
              }
            />
          </div>
          <div className="mt-2">
            {tenants.slice(0, 4).map((t, i) => (
              <div key={t.id}>
                {i > 0 && <Divider className="mx-4 sm:mx-5" />}
                <div className="flex items-center gap-3 px-4 py-3 sm:gap-3.5 sm:px-5 sm:py-3.5 min-w-0">
                  <Avatar name={t.name} size="md" className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-medium text-[var(--color-ink)]">
                      {t.name}
                    </div>
                    <div className="truncate text-[12.5px] text-[var(--color-ink-soft)]">
                      <Link
                        to={`/properties/${t.propertyId}`}
                        className="underline-offset-4 transition-colors hover:text-[var(--color-ink)] hover:underline"
                      >
                        {t.property}
                      </Link>{" "}
                      · {unitLabel(t.unit)}
                    </div>
                  </div>
                  <div className="tabular hidden text-right text-[13px] font-medium text-[var(--color-ink-soft)] sm:block shrink-0">
                    {currency(t.rent)}
                  </div>
                  <StatusBadge tone={paymentTone(t.state)} dot className="shrink-0">
                    {paymentLabel(t.state)}
                  </StatusBadge>
                </div>
              </div>
            ))}
          </div>
        </Surface>

        <Surface elevated className="min-w-0 overflow-hidden">
          <div className="px-4 pt-4 sm:px-5 sm:pt-5">
            <SectionHeader title="Recent activity" />
          </div>
          <div className="mt-3 px-4 pb-4 sm:mt-4 sm:px-5 sm:pb-5">
            <ol className="relative space-y-4 sm:space-y-5 before:absolute before:left-[5px] before:top-1.5 before:h-[calc(100%-1rem)] before:w-px before:bg-[var(--color-line)]">
              {activity.map((a) => (
                <li key={a.id} className="relative flex gap-4 pl-6 min-w-0">
                  <span className="absolute left-0 top-1.5 size-[11px] rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-accent-soft)] ring-1 ring-[var(--color-line)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-medium text-[var(--color-ink)] break-words">{a.title}</div>
                    <div className="text-[12.5px] text-[var(--color-ink-soft)] break-words">{a.detail}</div>
                  </div>
                  <span className="tabular shrink-0 text-[11.5px] text-[var(--color-ink-faint)]">
                    {a.time}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </Surface>
      </div>
    </div>
  );
}
