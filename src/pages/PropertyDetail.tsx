import { useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Building2, ChevronLeft, MoreHorizontal, Pencil, Plus, Receipt, UserPlus, Wallet, Trash2 } from "lucide-react";
import { usePortfolio } from "../data/PortfolioContext";
import { plural, propertyMetrics, stateLabel } from "../data/selectors";
import { propertyStateTone } from "../utils/format";
import { PageHeader } from "../components/ui/PageHeader";
import { Button } from "../components/ui/Button";
import { Dropdown } from "../components/ui/Dropdown";
import { Modal } from "../components/ui/Modal";
import { EmptyState } from "../components/ui/EmptyState";
import { StateText } from "../components/ui/StateText";
import { PropertyThumbnail } from "../components/ui/PropertyThumbnail";
import { PropertyFormModal } from "../components/property/PropertyFormModal";
import { getPropertyImages } from "../utils/propertyImages";
import { AddExpenseModal, AddUnitModal, AssignTenantModal, RecordRentModal } from "../components/property/UnitModals";
import { UnitsSection } from "../components/property/UnitsSection";
import {
  FinancialSnapshot,
  OccupancySection,
  PropertyActivityFeed,
  PropertyInfo,
  TenantsSection,
} from "../components/property/DetailSections";

type ModalState =
  | { kind: "edit" }
  | { kind: "unit" }
  | { kind: "tenant" }
  | { kind: "rent" }
  | { kind: "expense" }
  | { kind: "rented"; unitId: string }
  | { kind: "delete" }
  | null;

export default function PropertyDetail() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { properties, units, tenants, activity, updateProperty, resolveMaintenance, isLoading, deleteProperty } = usePortfolio();
  const [modal, setModal] = useState<ModalState>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const close = () => {
    if (!isDeleting) setModal(null);
  };

  const property = properties.find((p) => p.id === propertyId);
  const pUnits = useMemo(() => units.filter((u) => u.propertyId === propertyId), [units, propertyId]);
  const pTenants = useMemo(() => tenants.filter((t) => t.propertyId === propertyId), [tenants, propertyId]);
  const pActivity = useMemo(() => activity.filter((a) => a.propertyId === propertyId), [activity, propertyId]);
  const m = useMemo(() => propertyMetrics(pUnits, pTenants), [pUnits, pTenants]);

  if (isLoading && !property) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-[14px] text-[var(--color-ink-faint)]">
        Loading property details...
      </div>
    );
  }

  if (!property) {
    return (
      <div className="pt-6">
        <EmptyState
          icon={<Building2 />}
          title="Property not found"
          description="This property may have been removed, or the link is out of date."
          action={
            <Link to="/properties">
              <Button variant="secondary" size="sm" icon={<ChevronLeft />}>
                Back to properties
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const secondaryActions = [
    { label: "Add tenant", icon: <UserPlus />, onClick: () => setModal({ kind: "tenant" }) },
    { label: "Add unit", icon: <Plus />, onClick: () => setModal({ kind: "unit" }) },
    { label: "Add expense", icon: <Receipt />, onClick: () => setModal({ kind: "expense" }) },
    { label: "Edit property", icon: <Pencil />, onClick: () => setModal({ kind: "edit" }) },
    { label: "Delete property", icon: <Trash2 />, onClick: () => setModal({ kind: "delete" }), tone: "critical" as const },
  ];

  return (
    <div className="space-y-8 sm:space-y-10">
      <div className="space-y-6">
        {/* quiet breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-[var(--color-ink-faint)]">
          <Link
            to="/properties"
            className="-ml-1 inline-flex items-center gap-1 rounded-md px-1 py-0.5 transition-colors hover:text-[var(--color-ink)]"
          >
            <ChevronLeft className="size-4 stroke-[1.7]" />
            Properties
          </Link>
          <span>/</span>
          <span className="truncate text-[var(--color-ink-soft)]">{property.name}</span>
        </nav>

        <PageHeader
          eyebrow={property.type}
          title={property.name}
          description={
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>
                {property.locality}, {property.city} <span className="text-[var(--color-ink-faint)]">·</span>{" "}
                {plural(m.total, "unit")}
              </span>
              <StateText tone={propertyStateTone(m.state)}>{stateLabel[m.state]}</StateText>
            </span>
          }
          actions={
            <>
              {/* desktop: one primary, two quiet secondaries, overflow for the rest */}
              <div className="hidden items-center gap-2 sm:flex">
                <Button variant="ghost" size="sm" icon={<UserPlus />} onClick={secondaryActions[0].onClick}>
                  Add tenant
                </Button>
                <Button variant="ghost" size="sm" icon={<Plus />} onClick={secondaryActions[1].onClick}>
                  Add unit
                </Button>
                <Dropdown
                  trigger={
                    <span aria-label="More actions" className="inline-flex size-9 items-center justify-center rounded-[10px] text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-ink)]">
                      <MoreHorizontal className="size-[18px] stroke-[1.6]" />
                    </span>
                  }
                  items={secondaryActions.slice(2)}
                />
              </div>
              <Button size="sm" icon={<Wallet />} onClick={() => setModal({ kind: "rent" })} className="flex-1 sm:flex-none">
                Record rent
              </Button>
              <div className="sm:hidden">
                <Dropdown
                  trigger={
                    <span
                      aria-label="More actions"
                      className="inline-flex size-10 items-center justify-center rounded-[10px] border border-[var(--color-line-strong)] bg-[var(--color-surface)] text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-surface-muted)]"
                    >
                      <MoreHorizontal className="size-[18px] stroke-[1.6]" />
                    </span>
                  }
                  items={secondaryActions}
                />
              </div>
            </>
          }
          className="[&>div:last-child]:w-full sm:[&>div:last-child]:w-auto"
        />
      </div>

      {/* image composition — supports the data, never dominates it */}
      {(() => {
        const images = getPropertyImages(property);
        return (
          <div className="grid h-[220px] grid-cols-1 gap-3 sm:h-[300px] lg:h-[340px] lg:grid-cols-[2fr_1fr]">
            <PropertyThumbnail
              src={images.primary}
              alt={`${property.name} exterior`}
              className="h-full !aspect-auto rounded-[14px]"
            />
            <PropertyThumbnail
              src={images.secondary}
              alt={`${property.name} detail`}
              className="hidden h-full !aspect-auto rounded-[14px] lg:block"
            />
          </div>
        );
      })()}

      <FinancialSnapshot m={m} />
      <OccupancySection units={pUnits} tenants={pTenants} m={m} />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-8">
        <UnitsSection
          units={pUnits}
          tenants={pTenants}
          onAddUnit={() => setModal({ kind: "unit" })}
          onMarkRented={(unitId) => setModal({ kind: "rented", unitId })}
          onResolve={resolveMaintenance}
        />
        <div className="space-y-6">
          <TenantsSection tenants={pTenants} onAdd={() => setModal({ kind: "tenant" })} />
          <PropertyActivityFeed items={pActivity} />
          <PropertyInfo property={property} m={m} onEdit={() => setModal({ kind: "edit" })} />
        </div>
      </div>

      <PropertyFormModal
        open={modal?.kind === "edit"}
        onClose={close}
        mode="edit"
        property={property}
        onEdit={(patch) => updateProperty(property.id, patch)}
      />
      <AddUnitModal open={modal?.kind === "unit"} onClose={close} propertyId={property.id} />
      <AssignTenantModal open={modal?.kind === "tenant"} onClose={close} propertyId={property.id} />
      <AssignTenantModal
        open={modal?.kind === "rented"}
        onClose={close}
        propertyId={property.id}
        unitId={modal?.kind === "rented" ? modal.unitId : undefined}
      />
      <RecordRentModal open={modal?.kind === "rent"} onClose={close} propertyId={property.id} />
      <AddExpenseModal open={modal?.kind === "expense"} onClose={close} propertyId={property.id} />

      <Modal
        open={modal?.kind === "delete"}
        onClose={close}
        title="Delete Property?"
        description={`This will permanently delete ${property.name} and all associated records.`}
        footer={
          <>
            <Button variant="ghost" type="button" onClick={close} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="bg-[var(--color-critical)] text-white hover:bg-[var(--color-critical)]/90 border-[var(--color-critical)]"
              disabled={isDeleting}
              onClick={async () => {
                setIsDeleting(true);
                setDeleteError(null);
                try {
                  await deleteProperty(property.id);
                  navigate("/properties");
                } catch (err: any) {
                  setDeleteError(err.message || "An error occurred while deleting the property.");
                  setIsDeleting(false);
                }
              }}
            >
              {isDeleting ? "Deleting..." : "Delete Property"}
            </Button>
          </>
        }
      >
        <div className="p-6 space-y-4">
          <p className="text-[14px] text-[var(--color-ink-soft)]">
            Are you sure you want to delete <strong>{property.name}</strong>? This action cannot be undone.
          </p>
          <ul className="list-disc pl-5 text-[14px] text-[var(--color-ink-faint)] space-y-1">
            <li>The property</li>
            <li>Its units</li>
            <li>Its tenants</li>
            <li>Payment/rent history associated with those tenants</li>
            <li>Expenses</li>
            <li>Activities</li>
          </ul>
          {deleteError && (
            <div className="mt-4 rounded-md bg-[var(--color-critical)]/10 p-3 text-[13px] font-medium text-[var(--color-critical)]">
              {deleteError}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
