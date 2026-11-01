import React, { useRef, useEffect } from "react";
import { cn } from "../../utils/cn";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = true,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, " ").slice(0, 6).split("");

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const rawVal = e.target.value;
    const digit = rawVal.replace(/\D/g, "").slice(-1);

    const newDigits = [...digits];
    newDigits[index] = digit || "";
    const newValue = newDigits.join("").trim();
    onChange(newValue);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newValue.length === 6 && onComplete) {
      onComplete(newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!digits[index] || digits[index] === " ") {
        if (index > 0) {
          const newDigits = [...digits];
          newDigits[index - 1] = "";
          onChange(newDigits.join("").trim());
          inputRefs.current[index - 1]?.focus();
        }
      } else {
        const newDigits = [...digits];
        newDigits[index] = "";
        onChange(newDigits.join("").trim());
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    onChange(pastedData);
    const targetIndex = Math.min(pastedData.length, 5);
    inputRefs.current[targetIndex]?.focus();

    if (pastedData.length === 6 && onComplete) {
      onComplete(pastedData);
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-2.5">
      {[0, 1, 2, 3, 4, 5].map((index) => {
        const char = digits[index] && digits[index] !== " " ? digits[index] : "";
        const isMiddleDivider = index === 3;

        return (
          <React.Fragment key={index}>
            {isMiddleDivider && (
              <span className="hidden sm:inline-block text-[var(--color-ink-faint)] font-light text-lg select-none">
                –
              </span>
            )}
            <input
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={1}
              disabled={disabled}
              value={char}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              className={cn(
                "h-13 w-11 sm:h-14 sm:w-13 text-center font-mono text-xl sm:text-2xl font-semibold",
                "rounded-xl border border-white/80 bg-white/70 backdrop-blur-md",
                "text-[var(--color-ink)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.02),0_1px_3px_rgba(0,0,0,0.05)]",
                "transition-all duration-150 select-none",
                "hover:bg-white/85 focus:border-[var(--color-accent)] focus:bg-white/95 focus:outline-none",
                "focus:ring-4 focus:ring-[var(--color-accent)]/15 focus:shadow-[0_4px_16px_rgba(163,90,64,0.14)]",
                char ? "border-[var(--color-accent)]/50 bg-white/90 text-[var(--color-ink)]" : "",
                disabled ? "opacity-50 cursor-not-allowed" : "cursor-text"
              )}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
}
