import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ConvertedMoneyPair } from "./ConvertedMoney";
import { useConvertToBase } from "@/hooks/useConvertToBase";
import { Icon } from "@/components/ui/icon";
import { useFormatMoney, useT } from "@/i18n";
import { useSettings } from "@/stores/useSettings";
import { forecastGoal } from "@/features/goals/service";
import type { Goal } from "@/types";
import { cn } from "@/lib/utils";

interface GoalCardProps {
  goal: Goal;
  onClick?: () => void;
  compact?: boolean;
  className?: string;
}

export function GoalCard({ goal, onClick, compact, className }: GoalCardProps) {
  const t = useT();
  const formatMoney = useFormatMoney();
  const baseCurrency = useSettings((s) => s.settings.currency);
  const { convertToBase } = useConvertToBase();
  const f = forecastGoal(goal);
  const pct = Math.round(f.progress * 100);

  let etaLabel: string | null = null;
  if (f.etaKind === "deadline" && f.monthsRemaining !== null) {
    etaLabel = t("goals.months_left", { count: f.monthsRemaining });
  } else if (f.etaKind === "by_monthly" && f.monthsRemaining !== null) {
    etaLabel = t("goals.months_to_finish", { count: f.monthsRemaining });
  }

  return (
    <Card
      onClick={onClick}
      className={cn(
        "cursor-pointer tap transition-shadow hover:shadow-pop overflow-hidden",
        className,
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: `${goal.color}26`,
                color: goal.color,
              }}
            >
              <Icon name={goal.icon} className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-foreground truncate">
                {goal.name}
              </div>
              {!compact && goal.note && (
                <div className="text-xs text-muted-foreground truncate">
                  {goal.note}
                </div>
              )}
            </div>
          </div>
          <Badge variant={f.onTrack === false ? "warning" : "default"}>
            {pct}%
          </Badge>
        </div>

        <div className="mt-4">
          <Progress
            value={pct}
            indicatorClassName="bg-foreground"
            className="h-1.5"
          />
          <div className="mt-2 flex items-baseline justify-between gap-3">
            <ConvertedMoneyPair
              primary={goal.savedAmount}
              secondary={goal.targetAmount}
              currency={goal.currency}
              primaryClassName="text-base font-semibold"
              secondaryAmountClassName="text-sm"
            />
            {etaLabel && (
              <div className="text-xs text-muted-foreground shrink-0">
                {etaLabel}
              </div>
            )}
          </div>
          {f.monthlyRequired !== null && f.monthlyRequired > 0 && (
            <div className="mt-1 text-xs text-muted-foreground">
              {t("goals.monthly_required", {
                amount: formatMoney(
                  Math.round(f.monthlyRequired),
                  goal.currency,
                ),
              })}
              {goal.currency !== baseCurrency && (
                <span className="num">
                  {" "}
                  (≈{" "}
                  {formatMoney(
                    convertToBase(Math.round(f.monthlyRequired), goal.currency),
                    baseCurrency,
                  )}
                  )
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
