import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  type ActivityItem,
  type ActivityType,
  type PaymentMethod,
  type PaymentState,
  type Payment,
  type Property,
  type PropertyType,
  type Tenant,
  type Unit,
  type TenantNote,
} from "./types";
import { currency } from "../utils/format";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { getPropertyImage, getPropertyImages } from "../utils/propertyImages";
import {
  getActiveCollectionMonth,
  isPaymentOverdue,
  calculatePaymentState,
  isTenantLiableForBillingMonth,
  type RentCollectionMethod,
} from "../utils/billing";

export interface NewPropertyInput {
  name: string;
  address: string;
  locality: string;
  city: string;
  type: PropertyType;
  units: number;
  defaultRent: number;
  deposit: number;
  image: string;
  notes: string;
}

export type PropertyPatch = Partial<Omit<Property, "id">>;

interface PortfolioContextValue {
  properties: Property[];
  units: Unit[];
  tenants: Tenant[];
  tenantNotes: TenantNote[];
  payments: Payment[];
  activity: ActivityItem[];
  isLoading: boolean;
  addProperty: (input: NewPropertyInput) => Promise<string | undefined>;
  updateProperty: (id: string, patch: PropertyPatch) => Promise<void>;
  addUnit: (propertyId: string, input: { number: string; config: string; rent: number }) => Promise<void>;
  assignTenant: (unitId: string, input: { name: string; phone: string; rent: number }) => void;
  recordRent: (unitId: string, method: PaymentMethod) => Promise<void>;
  resolveMaintenance: (unitId: string) => void;
  addExpense: (propertyId: string, input: { category: string; amount: number; note: string }) => Promise<void>;
  updateRentStatus: (tenantId: string, isPaid: boolean) => Promise<void>;
  vacateTenant: (tenantId: string, vacatingDate: string) => Promise<void>;
  updateTenantRent: (tenantId: string, newRent: number) => Promise<void>;
  updateTenantName: (tenantId: string, newName: string) => Promise<void>;
  addTenantNote: (tenantId: string, content: string) => Promise<void>;
  updateTenantNote: (id: string, content: string) => Promise<void>;
  deleteTenantNote: (id: string) => Promise<void>;
  deleteProperty: (propertyId: string) => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

const defaultConfig: Record<PropertyType, string> = {
  Apartment: "2BHK",
  "Independent House": "House",
  Villa: "Villa",
  Shop: "Shop",
  Office: "Office",
  Other: "Unit",
};

function unitNumbers(count: number) {
  if (count === 1) return ["Main"];
  return Array.from({ length: count }, (_, i) => `${Math.floor(i / 4) + 1}0${(i % 4) + 1}`);
}

const mapProperty = (row: any): Property => {
  const images = getPropertyImages({
    id: row.id,
    name: row.name,
    type: row.type,
    image: row.image,
    secondaryImage: row.secondary_image,
  });

  return {
    id: row.id,
    name: row.name,
    address: row.address,
    locality: row.locality,
    city: row.city,
    type: row.type as PropertyType,
    image: images.primary,
    secondaryImage: images.secondary,
    depositPerUnit: row.deposit_per_unit,
    notes: row.notes,
  };
};

const mapUnit = (row: any): Unit => ({
  id: row.id,
  propertyId: row.property_id,
  number: row.number,
  config: row.config,
  rent: row.rent,
  status: row.status as "vacant" | "occupied" | "maintenance",
  vacantDays: row.vacant_days,
  maintenanceNote: row.maintenance_note,
});

const mapTenant = (row: any): Tenant => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  email: row.email,
  propertyId: row.property_id,
  property: row.units?.properties?.name || row.properties?.name || "",
  unitId: row.unit_id,
  unit: row.units?.number || "",
  since: row.lease_start || row.since || "Recent",
  rent: row.monthly_rent || row.rent,
  state: row.payment_state || row.state || "due",
  status: row.status as "active" | "vacated",
  vacatedOn: row.vacated_on,
});

const mapPayment = (
  row: any,
  allTenants: any[] = [],
  allUnits: any[] = [],
  allProps: any[] = [],
): Payment => {
  const tenantObj = allTenants.find((t) => t.id === row.tenant_id);
  const unitObj = allUnits.find((u) => u.id === (row.unit_id || tenantObj?.unit_id));
  const propObj = allProps.find((p) => p.id === (row.property_id || unitObj?.property_id || tenantObj?.property_id));

  return {
    id: row.id,
    tenantId: row.tenant_id,
    tenant: row.tenants?.name || tenantObj?.name || "Tenant",
    propertyId: row.property_id || propObj?.id || "",
    property: row.tenants?.units?.properties?.name || propObj?.name || "Property",
    unitId: row.unit_id || unitObj?.id || "",
    unit: row.tenants?.units?.number || (unitObj ? unitObj.number : ""),
    amount: row.amount,
    date: row.payment_date,
    billingMonth: row.billing_month,
    method: row.method as PaymentMethod,
    state: row.state as PaymentState,
    reference: row.reference,
    notes: row.notes,
    recordedAt: row.recorded_at,
  };
};

const mapActivity = (row: any): ActivityItem => {
  const d = new Date(row.created_at);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  return {
    id: row.id,
    propertyId: row.property_id,
    type: row.type as ActivityType,
    title: row.title,
    detail: row.detail,
    daysAgo: Math.floor(diff / 86400000),
    hoursAgo: Math.floor(diff / 3600000),
    time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  };
};

const mapTenantNote = (row: any): TenantNote => ({
  id: row.id,
  tenantId: row.tenant_id,
  content: row.content,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantNotes, setTenantNotes] = useState<TenantNote[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPortfolio = useCallback(async () => {
    if (!user) {
      setProperties([]);
      setUnits([]);
      setTenants([]);
      setTenantNotes([]);
      setPayments([]);
      setActivity([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const [propsRes, unitsRes, tenantsRes, notesRes, paymentsRes, activitiesRes] = await Promise.all([
        supabase.from("properties").select("*").order("created_at", { ascending: false }),
        supabase.from("units").select("*").order("created_at", { ascending: false }),
        supabase.from("tenants").select("*, units(number, properties(name))").order("created_at", { ascending: false }),
        supabase.from("tenant_notes").select("*").order("created_at", { ascending: false }),
        supabase.from("payments").select("*, tenants(name, units(number, properties(name)))").order("payment_date", { ascending: false }),
        supabase.from("activities").select("*").order("created_at", { ascending: false }).limit(100),
      ]);
      
      if (propsRes.error) throw propsRes.error;
      if (unitsRes.error) throw unitsRes.error;
      if (tenantsRes.error) throw tenantsRes.error;
      if (notesRes.error) throw notesRes.error;
      if (paymentsRes.error) throw paymentsRes.error;
      if (activitiesRes.error) throw activitiesRes.error;
      
      const activeTenants = tenantsRes.data.filter((t: any) => t.status === "active");
      const localUnits = unitsRes.data.map((u: any) => {
        const matchingTenant = activeTenants.find((t: any) => t.unit_id === u.id);
        const mapped = mapUnit(u);
        if (matchingTenant) {
          mapped.tenantId = matchingTenant.id;
        }
        return mapped;
      });

      const today = new Date();
      const method = (profile?.rent_collection_method as RentCollectionMethod) || "prepaid";
      const currentBillingMonth = getActiveCollectionMonth(method, today);
      const dueDay = profile?.default_due_day || 1;
      const grace = profile?.grace_period_days || 0;

      // Ensure every active liable tenant has a monthly billing obligation for the current cycle
      const activeLiableTenants = activeTenants.filter((t: any) =>
        isTenantLiableForBillingMonth(
          {
            leaseStart: t.lease_start,
            since: t.since,
            status: t.status,
            vacatedOn: t.vacated_on,
          },
          currentBillingMonth,
        ),
      );

      const missingPayments = activeLiableTenants.filter(
        (t: any) => !paymentsRes.data.some((p: any) => p.tenant_id === t.id && p.billing_month === currentBillingMonth),
      );

      let allPaymentsRaw = [...paymentsRes.data];

      if (missingPayments.length > 0 && user) {
        const isOverdue = isPaymentOverdue(currentBillingMonth, method, dueDay, grace, today);
        const inserts = missingPayments.map((t: any) => ({
          owner_id: user.id,
          property_id: t.property_id,
          unit_id: t.unit_id,
          tenant_id: t.id,
          amount: t.monthly_rent,
          billing_month: currentBillingMonth,
          payment_date: null,
          method: null,
          state: isOverdue ? "overdue" : "due",
        }));

        try {
          const { data: insertedData, error: insertError } = await supabase
            .from("payments")
            .insert(inserts)
            .select("*, tenants(name, units(number, properties(name)))");

          if (!insertError && insertedData) {
            allPaymentsRaw = [...insertedData, ...allPaymentsRaw];
          } else {
            const synthesized = inserts.map((ins) => ({
              ...ins,
              id: `gen-${ins.tenant_id}-${currentBillingMonth}`,
              created_at: today.toISOString(),
            }));
            allPaymentsRaw = [...synthesized, ...allPaymentsRaw];
          }
        } catch {
          const synthesized = inserts.map((ins) => ({
            ...ins,
            id: `gen-${ins.tenant_id}-${currentBillingMonth}`,
            created_at: today.toISOString(),
          }));
          allPaymentsRaw = [...synthesized, ...allPaymentsRaw];
        }
      }

      // Map payments with complete context and dynamic overdue state verification
      const mappedPayments = allPaymentsRaw.map((p: any) => {
        const mapped = mapPayment(p, tenantsRes.data, unitsRes.data, propsRes.data);
        if (mapped.state !== "paid") {
          const overdue = isPaymentOverdue(mapped.billingMonth, method, dueDay, grace, today);
          mapped.state = overdue ? "overdue" : "due";
        }
        return mapped;
      });

      const mappedTenants = tenantsRes.data.map((t: any) => {
        const tenant = mapTenant(t);
        const currentPayment = mappedPayments.find(
          (p: Payment) => p.tenantId === tenant.id && p.billingMonth === currentBillingMonth,
        );

        const isLiable = isTenantLiableForBillingMonth(
          {
            leaseStart: tenant.since,
            since: tenant.since,
            status: tenant.status,
            vacatedOn: tenant.vacatedOn,
          },
          currentBillingMonth,
        );

        if (!isLiable) {
          tenant.state = "paid"; // Not liable for current cycle; ignored by propertyMetrics for vacated
        } else {
          tenant.state = calculatePaymentState(
            currentPayment?.state,
            currentBillingMonth,
            method,
            dueDay,
            grace,
            today,
          );
        }
        return tenant;
      });

      setProperties(propsRes.data.map(mapProperty));
      setUnits(localUnits);
      setTenants(mappedTenants);
      setTenantNotes(notesRes.data.map(mapTenantNote));
      setPayments(mappedPayments);
      setActivity(activitiesRes.data.map(mapActivity));
    } catch (err: any) {
      console.error("Portfolio fetch error", {
        message: err.message,
        details: err.details,
        hint: err.hint,
        code: err.code,
        query: err
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const log = useCallback(async (propertyId: string, type: ActivityType, title: string, detail: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from("activities").insert({
        owner_id: user.id,
        property_id: propertyId,
        type,
        title,
        detail,
      });
      if (error) {
        console.error("Log error", error);
        return;
      }
      await fetchPortfolio();
    } catch (err) {
      console.error("Log error:", err);
    }
  }, [user, fetchPortfolio]);

  const addProperty = useCallback<PortfolioContextValue["addProperty"]>(
    async (input) => {
      if (!user) return;
      try {
        const { data: propData, error: propError } = await supabase
          .from("properties")
          .insert({
            owner_id: user.id,
            name: input.name.trim(),
            address: input.address.trim(),
            locality: input.locality.trim(),
            city: input.city.trim() || "Hyderabad",
            type: input.type,
            image: input.image || getPropertyImage({ id: `prop-${Date.now()}`, name: input.name, type: input.type }),
            deposit_per_unit: input.deposit,
            notes: input.notes.trim(),
          })
          .select()
          .single();

        if (propError) throw propError;
        
        const propertyId = propData.id;
        
        const unitsToInsert = unitNumbers(input.units).map((n) => ({
          owner_id: user.id,
          property_id: propertyId,
          number: n,
          config: defaultConfig[input.type],
          rent: input.defaultRent,
          status: "vacant",
          vacant_days: 0,
        }));

        const { error: unitsError } = await supabase
          .from("units")
          .insert(unitsToInsert);

        if (unitsError) throw unitsError;

        await fetchPortfolio();
        log(propertyId, "note", "Property added", `${propData.name} · ${input.units} ${input.units === 1 ? "unit" : "units"}`);
        return propertyId;
      } catch (err) {
        console.error("Error adding property:", err);
      }
    },
    [user, fetchPortfolio, log],
  );

  const updateProperty = useCallback<PortfolioContextValue["updateProperty"]>(
    async (id, patch) => {
      if (!user) return;
      try {
        const dbPatch: any = {};
        if (patch.name !== undefined) dbPatch.name = patch.name;
        if (patch.address !== undefined) dbPatch.address = patch.address;
        if (patch.locality !== undefined) dbPatch.locality = patch.locality;
        if (patch.city !== undefined) dbPatch.city = patch.city;
        if (patch.type !== undefined) dbPatch.type = patch.type;
        if (patch.image !== undefined) dbPatch.image = patch.image;
        if (patch.secondaryImage !== undefined) dbPatch.secondary_image = patch.secondaryImage;
        if (patch.depositPerUnit !== undefined) dbPatch.deposit_per_unit = patch.depositPerUnit;
        if (patch.notes !== undefined) dbPatch.notes = patch.notes;

        const { error } = await supabase
          .from("properties")
          .update(dbPatch)
          .eq("id", id)
          .eq("owner_id", user.id);

        if (error) throw error;
        
        await fetchPortfolio();
        log(id, "note", "Property details updated", "Information edited");
      } catch (err) {
        console.error("Error updating property:", err);
      }
    },
    [user, fetchPortfolio, log],
  );

  const deleteProperty = useCallback<PortfolioContextValue["deleteProperty"]>(async (propertyId) => {
    if (!user) return;
    const { error } = await supabase.rpc('delete_property_safely', {
      target_property_id: propertyId
    });
    if (error) throw error;
    await fetchPortfolio();
  }, [user, fetchPortfolio]);

  const addUnit = useCallback<PortfolioContextValue["addUnit"]>(
    async (propertyId, input) => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from("units")
          .insert({
            owner_id: user.id,
            property_id: propertyId,
            number: input.number.trim(),
            config: input.config.trim() || "Unit",
            rent: input.rent,
            status: "vacant",
            vacant_days: 0,
          })
          .select()
          .single();

        if (error) throw error;

        await fetchPortfolio();
        log(propertyId, "vacancy", `Unit ${data.number} added`, `${data.config} · listed at ${currency(data.rent)}`);
      } catch (err) {
        console.error("Error adding unit:", err);
      }
    },
    [user, fetchPortfolio, log],
  );

  const assignTenant = useCallback<PortfolioContextValue["assignTenant"]>(
    async (unitId, input) => {
      if (!user) return;
      const unit = units.find((u) => u.id === unitId);
      const property = unit && properties.find((p) => p.id === unit.propertyId);
      if (!unit || !property) return;

      if (unit.status === "occupied") {
        throw new Error("Unit is already occupied. Cannot assign a tenant to an occupied unit.");
      }
      const existingActiveTenant = tenants.find((t) => t.unitId === unitId && t.status === "active");
      if (existingActiveTenant) {
        throw new Error("Unit already has an active tenant.");
      }

      const name = input.name.trim();
      const parts = name.toLowerCase().split(" ");
      const email = `${parts[0]}.${parts[parts.length - 1]}@gmail.com`;
      const since = new Date().toISOString().split('T')[0];
      
      try {
        const { data: tenantData, error: tenantError } = await supabase.from("tenants").insert({
          owner_id: user.id,
          property_id: property.id,
          unit_id: unitId,
          name,
          phone: input.phone.trim() || "—",
          email,
          monthly_rent: input.rent,
          lease_start: since,
          payment_state: "due",
          status: "active"
        }).select().single();

        if (tenantError) {
          console.error("Assign tenant error", {
            message: tenantError.message,
            details: tenantError.details,
            hint: tenantError.hint,
            code: tenantError.code,
          });
          throw tenantError;
        }

        const { error: unitError } = await supabase
          .from("units")
          .update({ status: "occupied", vacant_days: null, maintenance_note: null })
          .eq("id", unitId)
          .eq("owner_id", user.id);

        if (unitError) {
          console.error("Update unit error:", {
            message: unitError.message,
            details: unitError.details,
            hint: unitError.hint,
            code: unitError.code,
          });
          throw unitError;
        }

        const today = new Date();
        const collectionMethod = (profile?.rent_collection_method as RentCollectionMethod) || "prepaid";
        const billingMonth = getActiveCollectionMonth(collectionMethod, today);
        const dueDay = profile?.default_due_day || 1;
        const grace = profile?.grace_period_days || 0;
        const isOverdue = isPaymentOverdue(billingMonth, collectionMethod, dueDay, grace, today);

        const { error: paymentError } = await supabase.from("payments").insert({
          owner_id: user.id,
          property_id: property.id,
          unit_id: unitId,
          tenant_id: tenantData.id,
          amount: input.rent,
          payment_date: null,
          billing_month: billingMonth,
          method: null,
          state: isOverdue ? "overdue" : "due"
        });
        
        if (paymentError) {
          console.error("Assign tenant payment error:", {
            message: paymentError.message,
            details: paymentError.details,
            hint: paymentError.hint,
            code: paymentError.code,
          });
          throw paymentError;
        }

        await fetchPortfolio();
        log(property.id, "lease", `Unit ${unit.number} rented`, `${name} · ${currency(input.rent)} / month`);
      } catch (err) {
        console.error(err);
        await fetchPortfolio();
        throw err;
      }
    },
    [user, units, properties, tenants, profile, fetchPortfolio, log],
  );

  const recordRent = useCallback<PortfolioContextValue["recordRent"]>(
    async (unitId, method) => {
      if (!user) return;
      const unit = units.find((u) => u.id === unitId);
      const tenant = unit && tenants.find((t) => t.id === unit.tenantId && t.status === "active");
      if (!unit || !tenant) return;
      
      const today = new Date();
      const collectionMethod = (profile?.rent_collection_method as RentCollectionMethod) || "prepaid";
      const billingMonth = getActiveCollectionMonth(collectionMethod, today);

      try {
        const { error: paymentError } = await supabase.from("payments").upsert({
          owner_id: user.id,
          property_id: tenant.propertyId,
          unit_id: unitId,
          tenant_id: tenant.id,
          amount: tenant.rent,
          payment_date: today.toISOString().split('T')[0],
          billing_month: billingMonth,
          method,
          state: "paid",
          recorded_at: today.toISOString(),
        }, { onConflict: "tenant_id, billing_month" });

        if (paymentError) throw paymentError;

        await fetchPortfolio();
        log(unit.propertyId, "payment", `${currency(tenant.rent)} rent received`, `Unit ${unit.number} · ${tenant.name}`);
      } catch (err) {
        console.error("Error recording rent:", err);
        throw err;
      }
    },
    [user, units, tenants, profile, fetchPortfolio, log],
  );

  const updateRentStatus = useCallback<PortfolioContextValue["updateRentStatus"]>(
    async (tenantId, isPaid) => {
      if (!user) return;
      const tenant = tenants.find((t) => t.id === tenantId);
      const unit = units.find((u) => u.id === tenant?.unitId);
      if (!tenant || !unit) return;

      const today = new Date();
      const collectionMethod = (profile?.rent_collection_method as RentCollectionMethod) || "prepaid";
      const billingMonth = getActiveCollectionMonth(collectionMethod, today);
      const dueDay = profile?.default_due_day || 1;
      const grace = profile?.grace_period_days || 0;

      try {
        const payload: any = {
          owner_id: user.id,
          property_id: tenant.propertyId,
          unit_id: unit.id,
          tenant_id: tenant.id,
          amount: tenant.rent,
          billing_month: billingMonth,
        };

        if (isPaid) {
          const existingPayment = payments.find(p => p.tenantId === tenant.id && p.billingMonth === billingMonth);
          payload.state = "paid";
          payload.payment_date = today.toISOString().split("T")[0];
          payload.method = existingPayment?.method || "UPI";
          payload.recorded_at = (existingPayment?.state === "paid" && existingPayment.recordedAt) 
            ? existingPayment.recordedAt 
            : new Date().toISOString();
        } else {
          const isOverdue = isPaymentOverdue(billingMonth, collectionMethod, dueDay, grace, today);
          payload.state = isOverdue ? "overdue" : "due";
          payload.payment_date = null;
          payload.method = null;
          payload.recorded_at = null;
        }

        const { error: paymentError } = await supabase
          .from("payments")
          .upsert(payload, { onConflict: "tenant_id, billing_month" });

        if (paymentError) throw paymentError;

        await fetchPortfolio();
        if (isPaid) {
          log(tenant.propertyId, "payment", `${currency(tenant.rent)} rent received`, `Unit ${unit.number} · ${tenant.name}`);
        }
      } catch (err) {
        console.error("Error updating rent status:", err);
        throw err;
      }
    },
    [user, tenants, units, payments, profile, fetchPortfolio, log],
  );

  const vacateTenant = useCallback<PortfolioContextValue["vacateTenant"]>(
    async (tenantId, vacatingDate) => {
      if (!user) return;
      const tenant = tenants.find((t) => t.id === tenantId);
      const unit = units.find((u) => u.id === tenant?.unitId);
      if (!tenant || !unit) return;

      try {
        const { error: tenantError } = await supabase
          .from("tenants")
          .update({ status: "vacated", vacated_on: vacatingDate })
          .eq("id", tenantId)
          .eq("owner_id", user.id);

        if (tenantError) throw tenantError;

        // Mark the unit as vacant since this tenant is leaving.
        const { error: unitError } = await supabase
          .from("units")
          .update({ status: "vacant", vacant_days: 0 })
          .eq("id", unit.id)
          .eq("owner_id", user.id);

        if (unitError) throw unitError;

        await fetchPortfolio();
        log(tenant.propertyId, "vacancy", `Unit ${unit.number} vacated`, `${tenant.name} moved out`);
      } catch (err) {
        console.error("Error vacating tenant:", err);
        throw err;
      }
    },
    [user, tenants, units, fetchPortfolio, log],
  );

  const resolveMaintenance = useCallback<PortfolioContextValue["resolveMaintenance"]>(
    (unitId) => {
      const unit = units.find((u) => u.id === unitId);
      if (!unit) return;
      setUnits((prev) =>
        prev.map((u) =>
          u.id === unitId ? { ...u, status: "vacant", vacantDays: 0, maintenanceNote: undefined } : u,
        ),
      );
      log(unit.propertyId, "maintenance", "Maintenance resolved", `Unit ${unit.number} is ready to let`);
    },
    [units, log],
  );

  const addExpense = useCallback<PortfolioContextValue["addExpense"]>(
    async (propertyId, input) => {
      if (!user) return;
      try {
        const today = new Date();
        const { error } = await supabase.from("expenses").insert({
          owner_id: user.id,
          property_id: propertyId,
          amount: input.amount,
          category: input.category,
          expense_date: today.toISOString().split('T')[0],
          note: input.note || null
        });

        if (error) {
          console.error("Add expense error:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
          throw error;
        }

        await log(propertyId, "expense", `${currency(input.amount)} ${input.category.toLowerCase()} expense`, input.note || "Logged");
      } catch (err) {
        console.error("Add expense error:", err);
        throw err;
      }
    },
    [user, log],
  );

  const updateTenantRent = useCallback<PortfolioContextValue["updateTenantRent"]>(
    async (tenantId, newRent) => {
      if (!user) return;
      if (newRent <= 0 || isNaN(newRent)) throw new Error("Invalid rent amount");
      
      const tenant = tenants.find((t) => t.id === tenantId);
      if (!tenant || tenant.status === "vacated") throw new Error("Cannot edit rent for a vacated tenant");

      try {
        const { error } = await supabase
          .from("tenants")
          .update({ monthly_rent: newRent })
          .eq("id", tenantId)
          .eq("owner_id", user.id);

        if (error) throw error;

        // Also update any pending (unpaid) payment record for the current billing cycle
        // Historical and already-paid payments remain completely intact
        const today = new Date();
        const collectionMethod = (profile?.rent_collection_method as RentCollectionMethod) || "prepaid";
        const currentBillingMonth = getActiveCollectionMonth(collectionMethod, today);
        await supabase
          .from("payments")
          .update({ amount: newRent })
          .eq("tenant_id", tenantId)
          .eq("billing_month", currentBillingMonth)
          .neq("state", "paid");

        await fetchPortfolio();
        log(tenant.propertyId, "lease", `Rent updated`, `${tenant.name} · ${currency(newRent)} / month`);
      } catch (err) {
        console.error("Error updating tenant rent:", err);
        throw err;
      }
    },
    [user, tenants, profile, fetchPortfolio, log],
  );

  const updateTenantName = useCallback<PortfolioContextValue["updateTenantName"]>(
    async (tenantId, newName) => {
      if (!user) throw new Error("You must be logged in to update tenant name");
      const trimmed = newName.trim();
      if (!trimmed) throw new Error("Tenant name cannot be empty");

      const tenant = tenants.find((t) => t.id === tenantId);
      if (!tenant) throw new Error("Tenant not found");

      try {
        const { error } = await supabase
          .from("tenants")
          .update({ name: trimmed })
          .eq("id", tenantId)
          .eq("owner_id", user.id);

        if (error) {
          console.error("Error updating tenant name:", error);
          throw error;
        }

        // Optimistically update tenants and payments in state immediately
        setTenants((prev) =>
          prev.map((t) => (t.id === tenantId ? { ...t, name: trimmed } : t))
        );
        setPayments((prev) =>
          prev.map((p) => (p.tenantId === tenantId ? { ...p, tenant: trimmed } : p))
        );

        // Sync with database
        await fetchPortfolio();
      } catch (err) {
        console.error("Error in updateTenantName:", err);
        throw err;
      }
    },
    [user, tenants, fetchPortfolio],
  );

  const addTenantNote = useCallback<PortfolioContextValue["addTenantNote"]>(
    async (tenantId, content) => {
      if (!user) return;
      try {
        const { error } = await supabase.from("tenant_notes").insert({
          owner_id: user.id,
          tenant_id: tenantId,
          content: content.trim(),
        });
        if (error) throw error;
        await fetchPortfolio();
      } catch (err) {
        console.error("Add tenant note error:", err);
        throw err;
      }
    },
    [user, fetchPortfolio],
  );

  const updateTenantNote = useCallback<PortfolioContextValue["updateTenantNote"]>(
    async (id, content) => {
      if (!user) return;
      try {
        const { error } = await supabase.from("tenant_notes").update({
          content: content.trim(),
          updated_at: new Date().toISOString(),
        }).eq("id", id).eq("owner_id", user.id);
        
        if (error) throw error;
        await fetchPortfolio();
      } catch (err) {
        console.error("Update tenant note error:", err);
        throw err;
      }
    },
    [user, fetchPortfolio],
  );

  const deleteTenantNote = useCallback<PortfolioContextValue["deleteTenantNote"]>(
    async (id) => {
      if (!user) return;
      try {
        const { error } = await supabase.from("tenant_notes").delete().eq("id", id).eq("owner_id", user.id);
        if (error) throw error;
        await fetchPortfolio();
      } catch (err) {
        console.error("Delete tenant note error:", err);
        throw err;
      }
    },
    [user, fetchPortfolio],
  );

  const value = useMemo(
    () => ({
      properties,
      units,
      tenants,
      tenantNotes,
      payments,
      activity,
      isLoading,
      addProperty,
      updateProperty,
      addUnit,
      assignTenant,
      recordRent,
      resolveMaintenance,
      addExpense,
      updateRentStatus,
      vacateTenant,
      updateTenantRent,
      updateTenantName,
      addTenantNote,
      updateTenantNote,
      deleteTenantNote,
      deleteProperty,
    }),
    [properties, units, tenants, tenantNotes, payments, activity, isLoading, addProperty, updateProperty, addUnit, assignTenant, recordRent, resolveMaintenance, addExpense, updateRentStatus, vacateTenant, updateTenantRent, updateTenantName, addTenantNote, updateTenantNote, deleteTenantNote, deleteProperty],
  );

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error("usePortfolio must be used inside <PortfolioProvider>");
  return ctx;
}
