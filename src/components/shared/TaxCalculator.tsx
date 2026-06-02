import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useFormatMoney, useT } from "@/i18n";
import type { Currency } from "@/types";

interface TaxCalculatorProps {
  gross: number;
  enabled: boolean;
  onEnabledChange: (next: boolean) => void;
  taxRate: number;
  onTaxRateChange: (next: number) => void;
  currency: Currency;
}

const PRESET_RATES = [10, 13, 19, 23, 30];

export function TaxCalculator({
  gross,
  enabled,
  onEnabledChange,
  taxRate,
  onTaxRateChange,
  currency,
}: TaxCalculatorProps) {
  const t = useT();
  const formatMoney = useFormatMoney();
  const taxAmount = enabled ? (gross * taxRate) / 100 : 0;
  const available = gross - taxAmount;

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between p-4">
        <div className="flex flex-col">
          <Label className="text-foreground normal-case text-sm tracking-normal font-medium">
            {t("tax.apply_label")}
          </Label>
          <span className="text-xs text-muted-foreground mt-0.5">
            {t("tax.apply_caption")}
          </span>
        </div>
        <Switch checked={enabled} onCheckedChange={onEnabledChange} />
      </div>

      <AnimatePresence initial={false}>
        {enabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="p-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">
                    {t("tax.rate")}
                  </span>
                  <span className="text-sm font-semibold tabular-nums">
                    {taxRate}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={50}
                    step={1}
                    value={taxRate}
                    onChange={(e) => onTaxRateChange(Number(e.target.value))}
                    className="w-full accent-foreground"
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {PRESET_RATES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => onTaxRateChange(r)}
                      className={
                        "rounded-full px-2.5 py-1 text-xs tap " +
                        (taxRate === r
                          ? "bg-foreground text-background"
                          : "bg-muted text-foreground hover:bg-subtle")
                      }
                    >
                      {r}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <Summary
                  label={t("tax.gross")}
                  value={formatMoney(gross || 0, currency)}
                />
                <Summary
                  label={t("tax.tax")}
                  value={`−${formatMoney(taxAmount, currency)}`}
                  className="text-destructive"
                />
                <Summary
                  label={t("tax.available")}
                  value={formatMoney(available, currency)}
                  className="text-success"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Summary({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="rounded-xl bg-muted/60 p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className={"mt-1 text-sm font-semibold num " + (className ?? "")}>
        {value}
      </div>
    </div>
  );
}
