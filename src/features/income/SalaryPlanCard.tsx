import { Briefcase, CalendarClock, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFormatMoney, useT } from "@/i18n";
import type { SalaryPart, SalaryPlan } from "@/types";
import { calculateSalaryPart, nextPaymentDateFor } from "./salaryPlan";
import { cn } from "@/lib/utils";

interface SalaryPlanCardProps {
  plan: SalaryPlan;
  onEdit: () => void;
  onLogPayment: (part: SalaryPart) => void;
}

export function SalaryPlanCard({
  plan,
  onEdit,
  onLogPayment,
}: SalaryPlanCardProps) {
  const t = useT();
  const formatMoney = useFormatMoney();

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success shrink-0">
            <Briefcase className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">
              {plan.name || t("income.types.salary")}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {formatMoney(plan.monthlyAmount, plan.currency)} ·{" "}
              {t("income.this_month")}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onEdit} aria-label="edit">
          <Pencil className="h-4 w-4" />
        </Button>
      </div>

      <div className="border-t border-border divide-y divide-border">
        {plan.parts.map((part, idx) => (
          <PartRow
            key={part.id || idx}
            plan={plan}
            part={part}
            index={idx}
            onLog={() => onLogPayment(part)}
          />
        ))}
      </div>
    </div>
  );
}

function PartRow({
  plan,
  part,
  index,
  onLog,
}: {
  plan: SalaryPlan;
  part: SalaryPart;
  index: number;
  onLog: () => void;
}) {
  const t = useT();
  const formatMoney = useFormatMoney();
  const nextDate = nextPaymentDateFor(part);
  const calc = calculateSalaryPart(plan, part, nextDate);

  const periodStart = `${calc.periodStart.getDate()}.${pad(
    calc.periodStart.getMonth() + 1,
  )}`;
  const periodEnd = `${calc.periodEnd.getDate()}.${pad(
    calc.periodEnd.getMonth() + 1,
  )}`;

  const partLabel = displayPartLabel(part.label, index, t);

  return (
    <div className="flex items-center justify-between gap-3 p-4">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl shrink-0",
            "bg-muted text-muted-foreground",
          )}
        >
          <CalendarClock className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{partLabel}</div>
          <div className="text-xs text-muted-foreground truncate">
            {t("salary_plan.summary_period", {
              start: periodStart,
              end: periodEnd,
            })}{" "}
            ·{" "}
            {t("salary_plan.summary_pays_on", { day: part.paymentDay })}
          </div>
          <div className="text-[11px] text-muted-foreground/80 mt-0.5 num">
            {formatMoney(plan.monthlyAmount, plan.currency)} ÷{" "}
            {calc.totalWorkingDays} × {calc.partWorkingDays}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className="text-sm font-semibold num">
          {formatMoney(calc.amount, plan.currency)}
        </span>
        <Button size="sm" variant="outline" onClick={onLog}>
          {t("salary_plan.log_button")}
        </Button>
      </div>
    </div>
  );
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function displayPartLabel(
  label: string,
  index: number,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  if (label === "first") return t("salary_plan.placeholder_part_first");
  if (label === "second") return t("salary_plan.placeholder_part_second");
  if (label) return label;
  return t("salary_plan.part", { n: index + 1 });
}
