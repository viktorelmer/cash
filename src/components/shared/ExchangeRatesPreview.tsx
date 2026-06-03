import { useMemo } from "react";
import { SectionHelpButton } from "@/components/shared/SectionHelpButton";
import { SUPPORTED_CURRENCIES } from "@/lib/exchange";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";
import type { Currency, ExchangeRates } from "@/types";

function formatRate(rate: number): string {
  return rate.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

interface ExchangeRatesPreviewProps {
  base: Currency;
  rates: ExchangeRates | null | undefined;
  className?: string;
}

export function ExchangeRatesPreview({
  base,
  rates,
  className,
}: ExchangeRatesPreviewProps) {
  const t = useT();

  const rows = useMemo(() => {
    if (!rates) return [];
    return SUPPORTED_CURRENCIES.filter(
      (quote) => quote !== base && typeof rates[quote] === "number",
    ).map((quote) => ({ quote, rate: rates[quote]! }));
  }, [base, rates]);

  if (rows.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-1">
        <span className="text-xs font-medium text-foreground">
          {t("settings.exchange_rates_preview", { base })}
        </span>
        <SectionHelpButton
          icon="alert"
          title={t("settings.exchange_rates_help.title")}
          description={t("settings.exchange_rates_help.body")}
          ariaLabel={t("settings.exchange_rates_help.aria_label")}
        />
      </div>
      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {rows.map(({ quote, rate }) => (
          <div
            key={quote}
            className="flex items-center justify-between rounded-lg bg-background/60 px-2.5 py-1.5 text-xs num"
          >
            <span className="font-medium text-muted-foreground">{quote}</span>
            <span className="text-foreground">
              {formatRate(rate)} {quote}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
