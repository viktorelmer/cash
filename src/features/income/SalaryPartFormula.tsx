import { useFormatMoney, useT } from "@/i18n";
import type { SalaryPart, SalaryPlan } from "@/types";
import {
  partBonusAmount,
  planMonthlyGross,
  planPartsBonusTotal,
  type SalaryPartCalculation,
} from "./salaryPlan";
import { cn } from "@/lib/utils";

interface SalaryPartFormulaProps {
  plan: SalaryPlan;
  part: SalaryPart;
  calc: SalaryPartCalculation;
  className?: string;
}

export function SalaryPartFormula({
  plan,
  part,
  calc,
  className,
}: SalaryPartFormulaProps) {
  const t = useT();
  const formatMoney = useFormatMoney();
  const partBonus = partBonusAmount(part);

  return (
    <div className={cn("space-y-1 text-[11px] text-muted-foreground num", className)}>
      <div>
        ({formatMoney(plan.monthlyAmount, plan.currency)} ÷{" "}
        {calc.totalWorkingDays}) × {calc.partWorkingDays} ={" "}
        {formatMoney(calc.salaryAmount, plan.currency)}
      </div>
      {partBonus > 0 && (
        <>
          <div>
            + {formatMoney(partBonus, plan.currency)}{" "}
            {t("salary_plan.formula_part_bonus")} ={" "}
            {formatMoney(calc.amount, plan.currency)}
          </div>
          <div className="text-muted-foreground/80">
            {t("salary_plan.formula_split", {
              salary: formatMoney(calc.salaryAmount, plan.currency),
              bonus: formatMoney(calc.bonusAmount, plan.currency),
            })}
          </div>
        </>
      )}
    </div>
  );
}

export function formatPlanMonthlySummary(
  plan: SalaryPlan,
  formatMoney: (amount: number, currency: SalaryPlan["currency"]) => string,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  const bonus = planPartsBonusTotal(plan);
  if (bonus <= 0) {
    return formatMoney(plan.monthlyAmount, plan.currency);
  }
  return t("salary_plan.summary_monthly_gross", {
    salary: formatMoney(plan.monthlyAmount, plan.currency),
    bonus: formatMoney(bonus, plan.currency),
    total: formatMoney(planMonthlyGross(plan), plan.currency),
  });
}
