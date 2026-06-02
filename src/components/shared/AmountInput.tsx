import * as React from "react";
import { cn } from "@/lib/utils";
import type { Currency } from "@/types";
import { currencySymbol } from "@/lib/format";

interface AmountInputProps {
  value: string;
  onValueChange: (next: string) => void;
  currency: Currency;
  autoFocus?: boolean;
  className?: string;
  size?: "lg" | "xl";
}

export function AmountInput({
  value,
  onValueChange,
  currency,
  autoFocus,
  className,
  size = "xl",
}: AmountInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
      .replace(/[^\d,.]/g, "")
      .replace(/,/g, ".");
    const parts = raw.split(".");
    let next = parts[0] ?? "";
    if (parts.length > 1) {
      next = `${parts[0]}.${parts.slice(1).join("").slice(0, 2)}`;
    }
    next = next.replace(/^0+(\d)/, "$1");
    onValueChange(next);
  };

  return (
    <div className={cn("flex items-end justify-center gap-1.5", className)}>
      <span
        className={cn(
          "leading-none text-muted-foreground font-medium",
          size === "xl" ? "text-3xl pb-1" : "text-2xl pb-0.5",
        )}
      >
        {currencySymbol(currency)}
      </span>
      <input
        inputMode="decimal"
        autoFocus={autoFocus}
        placeholder="0"
        value={value}
        onChange={handleChange}
        className={cn(
          "w-full bg-transparent text-center font-semibold tracking-tight num text-foreground placeholder:text-muted-foreground/40 outline-none border-0 focus-visible:ring-0",
          size === "xl" ? "text-6xl leading-none" : "text-4xl leading-none",
        )}
      />
    </div>
  );
}
