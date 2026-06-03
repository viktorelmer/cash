import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Briefcase,
  Plus,
  Sparkles,
  Trash2,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHelpButton } from "@/components/shared/SectionHelpButton";
import { TaxCalculator } from "@/components/shared/TaxCalculator";
import { CurrencySelector } from "@/components/shared/CurrencySelector";
import { useConvertToBase } from "@/hooks/useConvertToBase";
import { useIncomes, useSalaryPlans } from "@/hooks/useData";
import { useSettings } from "@/stores/useSettings";
import {
  incomeBonusAmount,
  incomeGross,
  incomeTaxAmount,
} from "@/features/income/amounts";
import {
  createIncome,
  deleteIncome,
  updateIncome,
} from "@/features/income/service";
import {
  createSalaryPlan,
  deleteSalaryPlan,
  logSalaryPayment,
  updateSalaryPlan,
} from "@/features/income/salaryPlan";
import { SalaryPlanCard } from "@/features/income/SalaryPlanCard";
import { SalaryPlanForm } from "@/features/income/SalaryPlanForm";
import { LogSalaryPaymentForm } from "@/features/income/LogSalaryPaymentForm";
import {
  useFormatMoney,
  useShortDateLabel,
  useT,
} from "@/i18n";
import {
  isoDate,
  isoToTimestamp,
  startOfMonth,
  endOfMonth,
} from "@/lib/date";
import { sum, cn } from "@/lib/utils";
import type {
  Currency,
  Income,
  IncomeType,
  RecurrenceFrequency,
  SalaryPart,
  SalaryPlan,
} from "@/types";
import { toast } from "sonner";

const INCOME_TYPES: { value: IncomeType; icon: string }[] = [
  { value: "salary", icon: "Briefcase" },
  { value: "investment", icon: "TrendingUp" },
  { value: "cashback", icon: "BadgePercent" },
  { value: "other", icon: "Banknote" },
];

const RECURRENCE: (RecurrenceFrequency | "none")[] = [
  "none",
  "monthly",
  "weekly",
  "biweekly",
  "yearly",
];

export function IncomePage() {
  const t = useT();
  const formatMoney = useFormatMoney();
  const shortDateLabel = useShortDateLabel();
  const incomes = useIncomes();
  const salaryPlans = useSalaryPlans();
  const currency = useSettings((s) => s.settings.currency);
  const defaultTaxRate = useSettings((s) => s.settings.defaultTaxRate);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Income | null>(null);
  const [planCreating, setPlanCreating] = useState(false);
  const [planEditing, setPlanEditing] = useState<SalaryPlan | null>(null);
  const [loggingPayment, setLoggingPayment] = useState<{
    plan: SalaryPlan;
    part: SalaryPart;
  } | null>(null);
  const { convertToBase } = useConvertToBase();

  const monthStats = useMemo(() => {
    const start = startOfMonth(new Date()).getTime();
    const end = endOfMonth(new Date()).getTime();
    const monthIncomes = incomes.filter(
      (i) => i.date >= start && i.date <= end,
    );
    const gross = sum(
      monthIncomes.map((i) => convertToBase(incomeGross(i), i.currency)),
    );
    const tax = sum(
      monthIncomes.map((i) => convertToBase(incomeTaxAmount(i), i.currency)),
    );
    return { gross, tax, net: gross - tax, count: monthIncomes.length };
  }, [incomes, convertToBase]);

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title={t("income.title")}
        description={t("income.description")}
        action={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            {t("common.add")}
          </Button>
        }
      />

      <Card>
        <CardContent className="p-5">
          <div className="flex items-baseline justify-between">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("income.this_month")}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("income.entries", { count: monthStats.count })}
            </span>
          </div>
          <div className="mt-2 text-3xl font-semibold tracking-tight num">
            {formatMoney(monthStats.net, currency)}
            <span className="text-base font-normal text-muted-foreground">
              {" / "}
              {formatMoney(monthStats.gross, currency)}
            </span>
          </div>
          {monthStats.tax > 0 && (
            <div className="mt-1 text-xs text-warning">
              {t("income.tax_reserved", {
                amount: formatMoney(monthStats.tax, currency),
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <h2 className="text-sm font-semibold">
                {t("salary_plan.section_title")}
              </h2>
              <SectionHelpButton
                title={t("salary_plan.help.title")}
                description={t("salary_plan.help.body")}
                ariaLabel={t("salary_plan.help.aria_label")}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t("salary_plan.section_caption")}
            </p>
          </div>
          <Button
            size="sm"
            variant={salaryPlans.length === 0 ? "default" : "outline"}
            onClick={() => setPlanCreating(true)}
          >
            <Plus className="h-4 w-4" />
            {salaryPlans.length === 0
              ? t("salary_plan.add_button")
              : t("common.add")}
          </Button>
        </div>

        {salaryPlans.length > 0 && (
          <div className="space-y-3">
            {salaryPlans.map((plan) => (
              <SalaryPlanCard
                key={plan.id}
                plan={plan}
                onEdit={() => setPlanEditing(plan)}
                onLogPayment={(part) =>
                  setLoggingPayment({ plan, part })
                }
              />
            ))}
          </div>
        )}
      </section>

      {incomes.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={t("income.empty_title")}
          description={t("income.empty_description")}
          action={
            <Button onClick={() => setCreating(true)}>
              {t("income.add_button")}
            </Button>
          }
        />
      ) : (
        <Card>
          <CardContent className="p-2">
            {incomes.map((i, idx) => (
              <div key={i.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left tap hover:bg-secondary/50"
                  onClick={() => setEditing(i)}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl",
                      "bg-success/10 text-success",
                    )}
                  >
                    <ArrowUpRight className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium truncate">
                        {i.source || t(`income.types.${i.type}`)}
                      </span>
                      <span className="num text-sm font-semibold">
                        +{formatMoney(incomeGross(i), i.currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground gap-3">
                      <span className="min-w-0 truncate">
                        {t(`income.types.${i.type}`)} ·{" "}
                        {shortDateLabel(i.date)}
                        {incomeBonusAmount(i) > 0
                          ? ` · ${t("income.list_with_bonus", {
                              salary: formatMoney(i.amount, i.currency),
                              bonus: formatMoney(
                                incomeBonusAmount(i),
                                i.currency,
                              ),
                            })}`
                          : ""}
                        {i.recurring
                          ? ` · ${t(`income.recurrence.${i.recurring}`)}`
                          : ""}
                      </span>
                      {i.taxEnabled && (
                        <span className="text-warning">
                          {t("income.tax_minus_short", {
                            amount: formatMoney(
                              incomeTaxAmount(i),
                              i.currency,
                            ),
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
                {idx < incomes.length - 1 && (
                  <Separator className="my-0.5" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <BottomSheet
        open={creating}
        onOpenChange={(o) => (o ? null : setCreating(false))}
        title={t("income.new_title")}
        maxHeight="92dvh"
      >
        <IncomeForm
          mode="create"
          defaultCurrency={currency}
          onSubmit={async (draft) => {
            await createIncome(draft);
            toast.success(t("income.toast_added"));
            setCreating(false);
          }}
          onCancel={() => setCreating(false)}
        />
      </BottomSheet>

      <BottomSheet
        open={!!editing}
        onOpenChange={(o) => (o ? null : setEditing(null))}
        title={t("income.edit_title")}
        maxHeight="92dvh"
      >
        {editing && (
          <IncomeForm
            mode="edit"
            initial={editing}
            defaultCurrency={currency}
            onSubmit={async (draft) => {
              await updateIncome(editing.id, draft);
              setEditing(null);
              toast.success(t("income.toast_updated"));
            }}
            onDelete={async () => {
              await deleteIncome(editing.id);
              setEditing(null);
              toast(t("income.toast_deleted"));
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </BottomSheet>

      <BottomSheet
        open={planCreating}
        onOpenChange={(o) => (o ? null : setPlanCreating(false))}
        title={t("salary_plan.new_title")}
        maxHeight="92dvh"
      >
        <SalaryPlanForm
          mode="create"
          defaultCurrency={currency}
          defaultTaxRate={defaultTaxRate ?? 10}
          onSubmit={async (draft) => {
            await createSalaryPlan(draft);
            setPlanCreating(false);
            toast.success(t("salary_plan.toast_plan_created"));
          }}
          onCancel={() => setPlanCreating(false)}
        />
      </BottomSheet>

      <BottomSheet
        open={!!planEditing}
        onOpenChange={(o) => (o ? null : setPlanEditing(null))}
        title={t("salary_plan.edit_title")}
        maxHeight="92dvh"
      >
        {planEditing && (
          <SalaryPlanForm
            mode="edit"
            initial={planEditing}
            defaultCurrency={currency}
            defaultTaxRate={defaultTaxRate ?? 10}
            onSubmit={async (draft) => {
              await updateSalaryPlan(planEditing.id, draft);
              setPlanEditing(null);
              toast.success(t("salary_plan.toast_plan_updated"));
            }}
            onDelete={async () => {
              if (confirm(t("salary_plan.delete_confirm"))) {
                await deleteSalaryPlan(planEditing.id);
                setPlanEditing(null);
                toast(t("salary_plan.toast_plan_deleted"));
              }
            }}
            onCancel={() => setPlanEditing(null)}
          />
        )}
      </BottomSheet>

      <BottomSheet
        open={!!loggingPayment}
        onOpenChange={(o) => (o ? null : setLoggingPayment(null))}
        title={t("salary_plan.log_title")}
        maxHeight="80dvh"
      >
        {loggingPayment && (
          <LogSalaryPaymentForm
            plan={loggingPayment.plan}
            part={loggingPayment.part}
            onSubmit={async ({ amount, paymentDate }) => {
              await logSalaryPayment({
                plan: loggingPayment.plan,
                part: loggingPayment.part,
                paymentDate,
                amount,
              });
              setLoggingPayment(null);
              toast.success(t("salary_plan.toast_payment_logged"));
            }}
            onCancel={() => setLoggingPayment(null)}
          />
        )}
      </BottomSheet>
    </div>
  );
}

interface IncomeDraft {
  amount: number;
  bonusAmount?: number;
  currency: Currency;
  source: string;
  type: IncomeType;
  date: number;
  recurring: RecurrenceFrequency | null;
  taxEnabled: boolean;
  taxRate: number;
  note: string;
}

function IncomeForm({
  mode,
  initial,
  defaultCurrency,
  onSubmit,
  onCancel,
  onDelete,
}: {
  mode: "create" | "edit";
  initial?: Income;
  defaultCurrency: Currency;
  onSubmit: (draft: IncomeDraft) => Promise<void> | void;
  onCancel: () => void;
  onDelete?: () => Promise<void> | void;
}) {
  const t = useT();
  const defaultTax = useSettings((s) => s.settings.defaultTaxRate);
  const [type, setType] = useState<IncomeType>(initial?.type ?? "salary");
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? "");
  const [bonus, setBonus] = useState(
    initial?.bonusAmount ? String(initial.bonusAmount) : "",
  );
  const [currency, setCurrency] = useState<Currency>(
    initial?.currency ?? defaultCurrency,
  );
  const [source, setSource] = useState(initial?.source ?? "");
  const [date, setDate] = useState(isoDate(initial?.date ?? Date.now()));
  const [recurring, setRecurring] = useState<RecurrenceFrequency | "none">(
    initial?.recurring ?? "none",
  );
  const [taxEnabled, setTaxEnabled] = useState(
    initial?.taxEnabled ?? type === "salary",
  );
  const [taxRate, setTaxRate] = useState(
    initial?.taxRate ?? defaultTax ?? 10,
  );
  const [note, setNote] = useState(initial?.note ?? "");

  const numericAmount = Number(amount) || 0;
  const numericBonus =
    type === "salary" ? Math.max(0, Number(bonus) || 0) : 0;
  const grossAmount = numericAmount + numericBonus;
  const canSubmit = grossAmount > 0;

  return (
    <div className="space-y-4">
      <div>
        <Label>{t("income.label_type")}</Label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {INCOME_TYPES.map((it) => (
            <button
              key={it.value}
              type="button"
              onClick={() => {
                setType(it.value);
                if (it.value === "salary" && !taxEnabled) setTaxEnabled(true);
                if (it.value !== "salary") {
                  setTaxEnabled(false);
                  setBonus("");
                }
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium tap",
                type === it.value
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card",
              )}
            >
              <Icon name={it.icon} className="h-3.5 w-3.5" />
              {t(`income.types.${it.value}`)}
            </button>
          ))}
        </div>
      </div>

      {type === "salary" ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>{t("income.label_salary_amount")}</Label>
            <Input
              className="mt-2"
              type="number"
              inputMode="decimal"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t("income.placeholder_amount")}
              autoFocus
            />
          </div>
          <div>
            <Label>{t("income.label_bonus")}</Label>
            <Input
              className="mt-2"
              type="number"
              inputMode="decimal"
              min={0}
              value={bonus}
              onChange={(e) => setBonus(e.target.value)}
              placeholder={t("income.placeholder_bonus")}
            />
          </div>
          <div className="col-span-2">
            <Label>{t("income.label_currency")}</Label>
            <div className="mt-2">
              <CurrencySelector value={currency} onValueChange={setCurrency} />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <div>
            <Label>{t("income.label_amount")}</Label>
            <Input
              className="mt-2"
              type="number"
              inputMode="decimal"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t("income.placeholder_amount")}
              autoFocus
            />
          </div>
          <div className="flex flex-col">
            <Label>{t("income.label_currency")}</Label>
            <div className="mt-2">
              <CurrencySelector value={currency} onValueChange={setCurrency} />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{t("income.label_source")}</Label>
          <Input
            className="mt-2"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder={
              type === "salary"
                ? t("income.placeholder_source_salary")
                : t("income.placeholder_source_other")
            }
          />
        </div>
        <div>
          <Label>{t("income.label_date")}</Label>
          <Input
            className="mt-2"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label>{t("income.label_recurring")}</Label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {RECURRENCE.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRecurring(r)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium tap",
                recurring === r
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card",
              )}
            >
              {t(`income.recurrence.${r}`)}
            </button>
          ))}
        </div>
      </div>

      <TaxCalculator
        gross={grossAmount}
        enabled={taxEnabled}
        onEnabledChange={setTaxEnabled}
        taxRate={taxRate}
        onTaxRateChange={setTaxRate}
        currency={currency}
      />

      <div>
        <Label>{t("income.label_note")}</Label>
        <Input
          className="mt-2"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("income.placeholder_note")}
        />
      </div>

      {type !== "salary" && (
        <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0" />
          {t("income.tax_optional_hint")}
        </div>
      )}

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
              amount: numericAmount,
              bonusAmount: numericBonus,
              currency,
              source,
              type,
              date: isoToTimestamp(date),
              recurring: recurring === "none" ? null : recurring,
              taxEnabled,
              taxRate,
              note,
            })
          }
        >
          {mode === "create" ? t("common.add") : t("common.save")}
        </Button>
      </div>
    </div>
  );
}
