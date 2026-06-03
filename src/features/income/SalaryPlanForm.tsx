import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { CurrencySelector } from "@/components/shared/CurrencySelector";
import { TaxCalculator } from "@/components/shared/TaxCalculator";
import { useFormatMoney, useT } from "@/i18n";
import type { Currency, SalaryPart, SalaryPlan } from "@/types";
import { cn } from "@/lib/utils";
import { SalaryPartFormula } from "./SalaryPartFormula";
import {
  DEFAULT_SALARY_PARTS,
  calculateSalaryPart,
  nextPaymentDateFor,
  normalizeSalaryPlan,
  planMonthlyGross,
  type SalaryPlanDraft,
} from "./salaryPlan";

interface SalaryPlanFormProps {
  mode: "create" | "edit";
  initial?: SalaryPlan;
  defaultCurrency: Currency;
  defaultTaxRate: number;
  onSubmit: (draft: SalaryPlanDraft) => Promise<void> | void;
  onCancel: () => void;
  onDelete?: () => Promise<void> | void;
}

export function SalaryPlanForm({
  mode,
  initial,
  defaultCurrency,
  defaultTaxRate,
  onSubmit,
  onCancel,
  onDelete,
}: SalaryPlanFormProps) {
  const t = useT();
  const formatMoney = useFormatMoney();

  const [name, setName] = useState(initial?.name ?? "");
  const [monthly, setMonthly] = useState(
    initial?.monthlyAmount?.toString() ?? "",
  );
  const [currency, setCurrency] = useState<Currency>(
    initial?.currency ?? defaultCurrency,
  );
  const [taxEnabled, setTaxEnabled] = useState(initial?.taxEnabled ?? true);
  const [taxRate, setTaxRate] = useState(
    initial?.taxRate ?? defaultTaxRate ?? 10,
  );
  const [note, setNote] = useState(initial?.note ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [parts, setParts] = useState<SalaryPart[]>(() => {
    const base =
      initial?.parts && initial.parts.length > 0
        ? initial.parts
        : DEFAULT_SALARY_PARTS;
    return initial ? normalizeSalaryPlan({ ...initial, parts: base }).parts : base;
  });

  const numericMonthly = Number(monthly) || 0;
  const canSubmit = numericMonthly > 0 && parts.length > 0;

  const planForPreview: SalaryPlan = useMemo(
    () => ({
      id: initial?.id ?? "preview",
      name,
      monthlyAmount: numericMonthly,
      currency,
      taxEnabled,
      taxRate,
      parts,
      note,
      active,
      createdAt: initial?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    }),
    [
      initial?.id,
      initial?.createdAt,
      name,
      numericMonthly,
      currency,
      taxEnabled,
      taxRate,
      parts,
      note,
      active,
    ],
  );

  const updatePart = (index: number, patch: Partial<SalaryPart>) => {
    setParts((cur) =>
      cur.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>{t("salary_plan.label_name")}</Label>
          <Input
            className="mt-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("salary_plan.placeholder_name")}
          />
        </div>
        <div className="col-span-2">
          <Label>{t("salary_plan.label_monthly")}</Label>
          <Input
            className="mt-2"
            type="number"
            inputMode="decimal"
            min={0}
            value={monthly}
            onChange={(e) => setMonthly(e.target.value)}
            placeholder={t("salary_plan.placeholder_monthly")}
          />
        </div>
        <div className="col-span-2">
          <Label>{t("salary_plan.label_currency")}</Label>
          <div className="mt-2">
            <CurrencySelector value={currency} onValueChange={setCurrency} />
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
        {t("salary_plan.explainer")}
      </div>

      <Separator />

      <div>
        <div className="flex items-baseline justify-between">
          <Label className="text-foreground normal-case text-sm tracking-normal font-medium">
            {t("salary_plan.parts_title")}
          </Label>
          <span className="text-xs text-muted-foreground">
            {t("salary_plan.parts_caption")}
          </span>
        </div>

        <div className="mt-3 space-y-3">
          {parts.map((part, index) => (
            <PartEditor
              key={index}
              index={index}
              part={part}
              plan={planForPreview}
              onChange={(patch) => updatePart(index, patch)}
            />
          ))}
        </div>
      </div>

      <TaxCalculator
        gross={planMonthlyGross(planForPreview)}
        enabled={taxEnabled}
        onEnabledChange={setTaxEnabled}
        taxRate={taxRate}
        onTaxRateChange={setTaxRate}
        currency={currency}
      />

      <div>
        <Label>{t("salary_plan.label_note")}</Label>
        <Input
          className="mt-2"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("salary_plan.placeholder_note")}
        />
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
        <div>
          <div className="text-sm font-medium">
            {active
              ? t("common.active")
              : t("salary_plan.paused")}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatMoney(planMonthlyGross(planForPreview), currency)} /{" "}
            {t("subscriptions.monthly").toLowerCase()}
          </div>
        </div>
        <Switch checked={active} onCheckedChange={setActive} />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button variant="ghost" className="flex-1" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        {onDelete && (
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => onDelete()}
          >
            <Trash2 className="h-4 w-4" />
            {t("common.delete")}
          </Button>
        )}
        <Button
          className="flex-1"
          disabled={!canSubmit}
          onClick={() =>
            onSubmit({
              name,
              monthlyAmount: numericMonthly,
              currency,
              taxEnabled,
              taxRate,
              parts,
              note,
              active,
            })
          }
        >
          {mode === "create" ? t("common.add") : t("common.save")}
        </Button>
      </div>
    </div>
  );
}

interface PartEditorProps {
  index: number;
  part: SalaryPart;
  plan: SalaryPlan;
  onChange: (patch: Partial<SalaryPart>) => void;
}

function PartEditor({ index, part, plan, onChange }: PartEditorProps) {
  const t = useT();
  const formatMoney = useFormatMoney();

  const nextDate = nextPaymentDateFor(part);
  const calc = calculateSalaryPart(plan, part, nextDate);

  const placeholderLabel =
    index === 0
      ? t("salary_plan.placeholder_part_first")
      : t("salary_plan.placeholder_part_second");

  const labelValue =
    part.label === "first"
      ? ""
      : part.label === "second"
      ? ""
      : part.label;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          {t("salary_plan.part", { n: index + 1 })}
        </span>
        <span className="text-sm font-semibold num">
          {formatMoney(calc.amount, plan.currency)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>{t("salary_plan.label_part_name")}</Label>
          <Input
            className="mt-2"
            value={labelValue}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder={placeholderLabel}
          />
        </div>
        <div>
          <Label>{t("salary_plan.label_payment_day")}</Label>
          <Input
            className="mt-2"
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            value={part.paymentDay}
            onChange={(e) =>
              onChange({ paymentDay: clamp(Number(e.target.value), 1, 31) })
            }
          />
        </div>
        <div>
          <Label>{t("salary_plan.label_period_offset")}</Label>
          <div className="mt-2 flex items-center gap-1 rounded-full bg-muted p-1">
            <button
              type="button"
              onClick={() => onChange({ periodMonthOffset: -1 })}
              className={cn(
                "flex-1 rounded-full px-2 py-1.5 text-xs font-medium tap",
                part.periodMonthOffset === -1
                  ? "bg-background shadow-soft"
                  : "text-muted-foreground",
              )}
            >
              {t("salary_plan.period_offset_prev")}
            </button>
            <button
              type="button"
              onClick={() => onChange({ periodMonthOffset: 0 })}
              className={cn(
                "flex-1 rounded-full px-2 py-1.5 text-xs font-medium tap",
                part.periodMonthOffset === 0
                  ? "bg-background shadow-soft"
                  : "text-muted-foreground",
              )}
            >
              {t("salary_plan.period_offset_current")}
            </button>
          </div>
        </div>
        <div>
          <Label>{t("salary_plan.label_period_start")}</Label>
          <Input
            className="mt-2"
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            value={part.periodStartDay}
            onChange={(e) =>
              onChange({
                periodStartDay: clamp(Number(e.target.value), 1, 31),
              })
            }
          />
        </div>
        <div>
          <Label>{t("salary_plan.label_period_end")}</Label>
          <Input
            className="mt-2"
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            value={part.periodEndDay}
            onChange={(e) =>
              onChange({
                periodEndDay: clamp(Number(e.target.value), 1, 31),
              })
            }
          />
        </div>
        <div className="col-span-2">
          <Label>{t("salary_plan.label_part_bonus")}</Label>
          <Input
            className="mt-2"
            type="number"
            inputMode="decimal"
            min={0}
            value={part.bonusAmount ? String(part.bonusAmount) : ""}
            onChange={(e) =>
              onChange({
                bonusAmount: Math.max(0, Number(e.target.value) || 0),
              })
            }
            placeholder={t("salary_plan.placeholder_bonus")}
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            {t("salary_plan.part_bonus_hint")}
          </p>
        </div>
      </div>

      <SalaryPartFormula
        plan={plan}
        part={part}
        calc={calc}
        className="rounded-xl bg-muted/40 p-3"
      />
    </div>
  );
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}
