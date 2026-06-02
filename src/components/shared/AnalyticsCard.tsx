import { useState } from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { CircleHelp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AnalyticsCardHelp {
  title: string;
  description: string;
  ariaLabel?: string;
}

interface AnalyticsCardProps {
  title: string;
  value: React.ReactNode;
  description?: React.ReactNode;
  icon?: LucideIcon;
  trend?: { value: number; suffix?: string; positiveIsGood?: boolean };
  className?: string;
  onClick?: () => void;
  help?: AnalyticsCardHelp;
}

export function AnalyticsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  onClick,
  help,
}: AnalyticsCardProps) {
  const [helpOpen, setHelpOpen] = useState(false);
  const isClickable = !!onClick;
  let trendClass = "text-muted-foreground";
  if (trend) {
    const goodIsPositive = trend.positiveIsGood ?? true;
    const isPositive = trend.value > 0;
    const isGood = goodIsPositive ? isPositive : !isPositive;
    if (trend.value !== 0)
      trendClass = isGood ? "text-success" : "text-destructive";
  }

  return (
    <>
      <div
        onClick={onClick}
        className={cn(
          "rounded-2xl border border-border bg-card p-4 shadow-card",
          isClickable && "cursor-pointer tap hover:shadow-pop transition-shadow",
          className,
        )}
      >
        <div className="flex items-center justify-between text-muted-foreground">
          <div className="flex min-w-0 items-center gap-1">
            <span className="text-xs uppercase tracking-wide font-medium truncate">
              {title}
            </span>
            {help && (
              <button
                type="button"
                aria-label={help.ariaLabel ?? help.title}
                onClick={(e) => {
                  e.stopPropagation();
                  setHelpOpen(true);
                }}
                className="shrink-0 rounded-full p-0.5 text-muted-foreground/70 tap hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                <CircleHelp className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {Icon && <Icon className="h-4 w-4 shrink-0" />}
        </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight num">
        {value}
      </div>
      {(description || trend) && (
        <div className="mt-1 flex items-center gap-2 text-xs">
          {trend && (
            <span className={cn("font-medium tabular-nums", trendClass)}>
              {trend.value > 0 ? "+" : ""}
              {trend.value.toLocaleString(undefined, {
                maximumFractionDigits: 1,
              })}
              {trend.suffix ?? "%"}
            </span>
          )}
          {description && (
            <span className="text-muted-foreground">{description}</span>
          )}
        </div>
      )}
      </div>

      {help && (
        <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{help.title}</DialogTitle>
              <DialogDescription className="leading-relaxed">
                {help.description}
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
