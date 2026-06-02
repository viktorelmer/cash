import { useConvertToBase } from "@/hooks/useConvertToBase";
import { useFormatMoney } from "@/i18n";
import { useSettings } from "@/stores/useSettings";
import { cn } from "@/lib/utils";
import type { Currency } from "@/types";

interface ConvertedMoneyProps {
  amount: number;
  currency: Currency;
  prefix?: string;
  className?: string;
  amountClassName?: string;
  convertedClassName?: string;
}

export function ConvertedMoney({
  amount,
  currency,
  prefix = "",
  className,
  amountClassName,
  convertedClassName,
}: ConvertedMoneyProps) {
  const formatMoney = useFormatMoney();
  const baseCurrency = useSettings((s) => s.settings.currency);
  const { convertToBase } = useConvertToBase();
  const showConverted = currency !== baseCurrency;
  const converted = showConverted
    ? convertToBase(amount, currency)
    : null;

  return (
    <div className={cn("text-right", className)}>
      <span className={cn("num tabular-nums", amountClassName)}>
        {prefix}
        {formatMoney(amount, currency)}
      </span>
      {converted !== null && (
        <div
          className={cn(
            "text-[10px] text-muted-foreground num tabular-nums",
            convertedClassName,
          )}
        >
          ≈ {formatMoney(converted, baseCurrency)}
        </div>
      )}
    </div>
  );
}

interface ConvertedMoneyPairProps {
  primary: number;
  secondary: number;
  currency: Currency;
  className?: string;
  primaryClassName?: string;
  secondaryAmountClassName?: string;
  convertedClassName?: string;
}

export function ConvertedMoneyPair({
  primary,
  secondary,
  currency,
  className,
  primaryClassName,
  secondaryAmountClassName,
  convertedClassName,
}: ConvertedMoneyPairProps) {
  const formatMoney = useFormatMoney();
  const baseCurrency = useSettings((s) => s.settings.currency);
  const { convertToBase } = useConvertToBase();
  const showConverted = currency !== baseCurrency;

  return (
    <div className={className}>
      <div className={cn("num tabular-nums", primaryClassName)}>
        {formatMoney(primary, currency)}
        <span
          className={cn(
            "text-muted-foreground font-normal",
            secondaryAmountClassName,
          )}
        >
          {" / "}
          {formatMoney(secondary, currency)}
        </span>
      </div>
      {showConverted && (
        <div
          className={cn(
            "text-xs text-muted-foreground num tabular-nums",
            convertedClassName,
          )}
        >
          ≈ {formatMoney(convertToBase(primary, currency), baseCurrency)} /{" "}
          {formatMoney(convertToBase(secondary, currency), baseCurrency)}
        </div>
      )}
    </div>
  );
}
