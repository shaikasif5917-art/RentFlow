import { useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Surface } from "../components/ui/Surface";
import { Button } from "../components/ui/Button";
import { BrandMark } from "../components/shell/BrandMark";
import { Field, Select, TextInput } from "../components/ui/Field";

export default function Setup() {
  const { updateProfile } = useAuth();
  
  const [method, setMethod] = useState<"prepaid" | "postpaid" | null>(null);
  const [dueDay, setDueDay] = useState("1");
  const [gracePeriod, setGracePeriod] = useState("5");
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleNext = () => {
    if (step === 1 && method) {
      setStep(2);
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!method) return;
    
    const day = parseInt(dueDay, 10);
    const grace = parseInt(gracePeriod, 10);
    
    if (isNaN(day) || day < 1 || day > 31) {
      setError("Due day must be between 1 and 31");
      return;
    }
    if (isNaN(grace) || grace < 0) {
      setError("Grace period must be a valid number");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await updateProfile({
        rent_collection_method: method,
        default_due_day: day,
        grace_period_days: grace,
        setup_completed: true,
      });
    } catch (err: any) {
      setError(err.message || "Failed to save settings.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg)] px-4 py-12">
      <div className="mb-8">
        <BrandMark />
      </div>

      <Surface elevated className="w-full max-w-md overflow-hidden p-6 sm:p-8">
        <div className="mb-8 space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink)]">
            Welcome to RentFloww
          </h1>
          <p className="text-[14px] text-[var(--color-ink-soft)]">
            Let's configure your default rent collection rules.
          </p>
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="mb-3 text-[15px] font-semibold text-[var(--color-ink)]">How do you collect rent from your tenants?</h2>
              
              <div className="space-y-3">
                <button
                  onClick={() => setMethod("prepaid")}
                  className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-all ${
                    method === "prepaid"
                      ? "border-[var(--color-accent)] bg-[var(--color-accent-wash)] ring-1 ring-[var(--color-accent)]"
                      : "border-[var(--color-line)] hover:border-[var(--color-line-strong)] bg-transparent"
                  }`}
                >
                  <div className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${method === "prepaid" ? "border-[var(--color-accent)] bg-[var(--color-accent)]" : "border-[var(--color-line-strong)]"}`}>
                    {method === "prepaid" && <Check className="size-3.5 text-white" strokeWidth={3} />}
                  </div>
                  <div>
                    <div className="font-semibold text-[var(--color-ink)]">Prepaid</div>
                    <div className="mt-1 text-[13px] text-[var(--color-ink-soft)] leading-relaxed">
                      Rent is collected before or at the start of the rental period.
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setMethod("postpaid")}
                  className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-all ${
                    method === "postpaid"
                      ? "border-[var(--color-accent)] bg-[var(--color-accent-wash)] ring-1 ring-[var(--color-accent)]"
                      : "border-[var(--color-line)] hover:border-[var(--color-line-strong)] bg-transparent"
                  }`}
                >
                  <div className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${method === "postpaid" ? "border-[var(--color-accent)] bg-[var(--color-accent)]" : "border-[var(--color-line-strong)]"}`}>
                    {method === "postpaid" && <Check className="size-3.5 text-white" strokeWidth={3} />}
                  </div>
                  <div>
                    <div className="font-semibold text-[var(--color-ink)]">Postpaid</div>
                    <div className="mt-1 text-[13px] text-[var(--color-ink-soft)] leading-relaxed">
                      Rent is collected after the rental period, according to the agreed payment deadline.
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <Button className="w-full h-11" disabled={!method} onClick={handleNext}>
              Continue <ChevronRight className="ml-2 size-4" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleComplete} className="space-y-6 animate-fade-in">
            <div>
              <h2 className="mb-4 text-[15px] font-semibold text-[var(--color-ink)]">Set your default payment deadline</h2>
              
              <div className="space-y-5 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-5">
                <Field label="Default Due Day">
                  <Select value={dueDay} onChange={(e) => setDueDay(e.target.value)}>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day}>
                        {day}{[1, 21, 31].includes(day) ? "st" : [2, 22].includes(day) ? "nd" : [3, 23].includes(day) ? "rd" : "th"} of the month
                      </option>
                    ))}
                  </Select>
                </Field>

                <div className="space-y-1">
                  <Field label="Grace Period (Days)">
                    <TextInput
                      type="number"
                      min="0"
                      max="31"
                      value={gracePeriod}
                      onChange={(e) => setGracePeriod(e.target.value)}
                      required
                    />
                  </Field>
                  <p className="text-[12.5px] text-[var(--color-ink-faint)]">
                    Number of days before a pending payment is marked Overdue.
                  </p>
                </div>
              </div>
              
              {error && <div className="mt-4 text-[13px] text-[var(--color-critical)]">{error}</div>}
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setStep(1)} disabled={isSubmitting}>
                Back
              </Button>
              <Button type="submit" className="flex-[2]" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Complete Setup"}
              </Button>
            </div>
          </form>
        )}
      </Surface>
    </div>
  );
}
