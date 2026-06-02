import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useFormatMoney, useT } from "@/i18n";
import type { Currency } from "@/types";

interface BudgetProgressProps {
  spent: number;
  limit: number;
  currency: Currency;
  label?: string;
  caption?: string;
  className?: string;
  size?: "sm" | "md";
}

export function BudgetProgress({
  spent,
  limit,
  currency,
  label,
  caption,
  className,
  size = "md",
}: BudgetProgressProps) {
  const t = useT();
  const formatMoney = useFormatMoney();
  const ratio = limit > 0 ? spent / limit : 0;
  const pct = Math.min(ratio * 100, 100);
  const overspent = spent > limit;

  let indicatorClass = "bg-foreground";
  if (overspent) indicatorClass = "bg-destructive";
  else if (ratio > 0.8) indicatorClass = "bg-warning";

  return (
    <div className={cn("space-y-1.5", className)}>
      {(label || caption) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <span
              className={cn(
                "text-foreground font-medium",
                size === "sm" ? "text-xs" : "text-sm",
              )}
            >
              {label}
            </span>
          )}
          {caption && (
            <span
              className={cn(
                "tabular-nums text-muted-foreground",
                size === "sm" ? "text-xs" : "text-sm",
              )}
            >
              {caption}
            </span>
          )}
        </div>
      )}
      <Progress
        value={pct}
        className={cn(size === "sm" ? "h-1.5" : "h-2")}
        indicatorClassName={indicatorClass}
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
        <span>
          {formatMoney(spent, currency)} {t("budget_progress.spent")}
        </span>
        <span>
          {overspent ? `${t("budget_progress.over_by")} ` : ""}
          {formatMoney(Math.abs(limit - spent), currency)}
        </span>
      </div>
    </div>
  );
}
