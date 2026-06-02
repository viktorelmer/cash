import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormatMoney, useShortDateLabel, useT } from "@/i18n";
import { isoDate, isoToTimestamp } from "@/lib/date";
import type { SalaryPart, SalaryPlan } from "@/types";
import { calculateSalaryPart } from "./salaryPlan";

interface LogSalaryPaymentFormProps {
  plan: SalaryPlan;
  part: SalaryPart;
  onSubmit: (args: {
    amount: number;
    paymentDate: Date;
  }) => Promise<void> | void;
  onCancel: () => void;
}

export function LogSalaryPaymentForm({
  plan,
  part,
  onSubmit,
  onCancel,
}: LogSalaryPaymentFormProps) {
  const t = useT();
  const formatMoney = useFormatMoney();
  const shortDate = useShortDateLabel();

  const [date, setDate] = useState(isoDate(Date.now()));
  const paymentDate = useMemo(() => new Date(isoToTimestamp(date)), [date]);
  const calc = useMemo(
    () => calculateSalaryPart(plan, part, paymentDate),
    [plan, part, paymentDate],
  );
  const [amount, setAmount] = useState<string>("");
  const [touched, setTouched] = useState(false);

  const effectiveAmount = touched
    ? Number(amount) || 0
    : calc.amount;

  const partLabel =
    part.label === "first"
      ? t("salary_plan.placeholder_part_first")
      : part.label === "second"
      ? t("salary_plan.placeholder_part_second")
      : part.label || t("income.types.salary");

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {t("salary_plan.log_part_label")}
        </div>
        <div className="text-sm font-semibold">{partLabel}</div>
        <div className="text-xs text-muted-foreground num">
          {t("salary_plan.log_period_label")}: {shortDate(calc.periodStart)}{" "}
          – {shortDate(calc.periodEnd)}
        </div>
        <div className="text-[11px] text-muted-foreground num pt-1">
          ({formatMoney(plan.monthlyAmount, plan.currency)} ÷{" "}
          {calc.totalWorkingDays}) × {calc.partWorkingDays} ={" "}
          {formatMoney(calc.amount, plan.currency)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{t("salary_plan.log_payment_date")}</Label>
          <Input
            className="mt-2"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <Label>{t("salary_plan.log_amount")}</Label>
          <Input
            className="mt-2"
            type="number"
            inputMode="decimal"
            value={touched ? amount : calc.amount.toString()}
            onChange={(e) => {
              setTouched(true);
              setAmount(e.target.value);
            }}
          />
          {!touched && (
            <span className="mt-1 block text-[11px] text-muted-foreground">
              {t("salary_plan.log_amount_calculated")}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button variant="ghost" className="flex-1" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        <Button
          className="flex-1"
          disabled={effectiveAmount <= 0}
          onClick={() =>
            onSubmit({
              amount: effectiveAmount,
              paymentDate,
            })
          }
        >
          {t("salary_plan.log_submit")}
        </Button>
      </div>
    </div>
  );
}
