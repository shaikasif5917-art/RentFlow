import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { ImagePlus, X } from "lucide-react";
import { propertyTypes, type Property, type PropertyType } from "../../data/types";
import type { NewPropertyInput } from "../../data/PortfolioContext";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Field, FormGroup, Select, TextInput, Textarea } from "../ui/Field";

interface Props {
  open: boolean;
  onClose: () => void;
  mode: "add" | "edit";
  property?: Property;
  onAdd?: (input: NewPropertyInput) => void | Promise<void>;
  onEdit?: (patch: Partial<Omit<Property, "id">>) => void | Promise<void>;
}

interface FormProps extends Omit<Props, "open"> {
  setIsSubmitting: (val: boolean) => void;
}

function PropertyForm({ mode, property, onClose, onAdd, onEdit, setIsSubmitting }: FormProps) {
  const [name, setName] = useState(property?.name ?? "");
  const [address, setAddress] = useState(property?.address ?? "");
  const [locality, setLocality] = useState(property?.locality ?? "");
  const [city, setCity] = useState(property?.city ?? "Hyderabad");
  const [type, setType] = useState<PropertyType>(property?.type ?? "Apartment");
  const [units, setUnits] = useState("4");
  const [rent, setRent] = useState("20000");
  const [deposit, setDeposit] = useState(String(property?.depositPerUnit ?? 50000));
  const [image, setImage] = useState(property?.image ?? "");
  const [notes, setNotes] = useState(property?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const pickImage = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Give the property a name";
    if (!address.trim()) next.address = "Add the street address";
    if (!locality.trim()) next.locality = "Required";
    const u = Number(units);
    if (mode === "add" && (!Number.isInteger(u) || u < 1 || u > 60)) next.units = "Enter 1–60";
    setErrors(next);
    if (Object.keys(next).length) return;

    setIsSubmitting(true);
    try {
      if (mode === "add") {
        await onAdd?.({
          name, address, locality, city, type, units: u,
          defaultRent: Math.max(0, Number(rent) || 0),
          deposit: Math.max(0, Number(deposit) || 0),
          image, notes,
        });
      } else {
        await onEdit?.({
          name: name.trim(), address: address.trim(), locality: locality.trim(), city: city.trim(), type,
          depositPerUnit: Math.max(0, Number(deposit) || 0), image: image || property?.image || "", notes: notes.trim(),
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form id="property-form" onSubmit={submit} className="space-y-5 sm:space-y-7" noValidate>
      <FormGroup title="PROPERTY DETAILS">
        <Field label="Property name" error={errors.name}>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Green Residency" autoFocus />
        </Field>
        <div className={mode === "add" ? "grid grid-cols-1 gap-4 sm:grid-cols-2" : ""}>
          <Field label="Property type">
            <Select value={type} onChange={(e) => setType(e.target.value as PropertyType)}>
              {propertyTypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>
          {mode === "add" && (
            <Field label="Units" error={errors.units}>
              <TextInput inputMode="numeric" value={units} onChange={(e) => setUnits(e.target.value)} />
            </Field>
          )}
        </div>
      </FormGroup>

      <FormGroup title="LOCATION">
        <Field label="Address" error={errors.address}>
          <TextInput value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Plot / door number, street" />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Locality" error={errors.locality}>
            <TextInput value={locality} onChange={(e) => setLocality(e.target.value)} placeholder="Madhapur" />
          </Field>
          <Field label="City">
            <TextInput value={city} onChange={(e) => setCity(e.target.value)} />
          </Field>
        </div>
      </FormGroup>

      <FormGroup title="RENT & DEPOSIT">
        <div className={mode === "add" ? "grid grid-cols-1 gap-4 sm:grid-cols-2" : ""}>
          {mode === "add" && (
            <Field label="Default rent" hint="per unit / month">
              <TextInput inputMode="numeric" value={rent} onChange={(e) => setRent(e.target.value)} />
            </Field>
          )}
          <Field label="Security deposit" hint="per unit">
            <TextInput inputMode="numeric" value={deposit} onChange={(e) => setDeposit(e.target.value)} />
          </Field>
        </div>
      </FormGroup>

      <FormGroup title="IMAGE & NOTES">
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pickImage(e.target.files?.[0])} />
        {image ? (
          <div className="group relative overflow-hidden rounded-[10px] ring-1 ring-inset ring-[var(--color-line)]">
            <img src={image} alt="Property preview" className="aspect-[16/7] w-full object-cover" />
            <div className="absolute right-2 top-2 flex gap-1.5">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded-md bg-white/90 px-2.5 py-1 text-[12px] font-medium text-[var(--color-ink)] backdrop-blur transition-colors hover:bg-white"
              >
                Replace
              </button>
              <button
                type="button"
                aria-label="Remove image"
                onClick={() => setImage("")}
                className="rounded-md bg-white/90 p-1.5 text-[var(--color-ink)] backdrop-blur transition-colors hover:bg-white"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-1.5 rounded-[14px] border border-dashed border-slate-300 bg-white/50 py-6 text-[var(--color-ink-faint)] backdrop-blur-sm transition-all duration-200 hover:border-[var(--color-accent)]/60 hover:bg-white/80 hover:text-[var(--color-accent)] cursor-pointer shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
          >
            <ImagePlus className="size-5 stroke-[1.6] mb-1" />
            <span className="text-[13px] font-semibold text-[var(--color-ink)]">Add a photo</span>
            <span className="text-[12px] text-[var(--color-ink-faint)]">Optional — a fitting image is used otherwise</span>
          </button>
        )}
        <Field label="Notes">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Parking, maintenance, lease terms…" className="min-h-[100px]" />
        </Field>
      </FormGroup>
    </form>
  );
}

export function PropertyFormModal(props: Props) {
  const { open, onClose, mode } = props;
  const [isSubmitting, setIsSubmitting] = useState(false);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "add" ? "Add property" : "Edit property"}
      description={mode === "add" ? "Add a property and its units to your portfolio." : "Update the details of this property."}
      className="sm:max-w-[42rem] sm:max-h-[90vh]"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="property-form" disabled={isSubmitting}>
            {mode === "add" ? "Add property" : "Save changes"}
          </Button>
        </>
      }
    >
      <PropertyForm {...props} setIsSubmitting={setIsSubmitting} />
    </Modal>
  );
}
