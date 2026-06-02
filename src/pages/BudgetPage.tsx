import { useEffect, useMemo, useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon } from "@/components/ui/icon";
import { BudgetProgress } from "@/components/shared/BudgetProgress";
import { CurrencySelector } from "@/components/shared/CurrencySelector";
import {
  useBudgetMap,
  useMonthExpenses,
  useTopLevelCategories,
} from "@/hooks/useData";
import { useConvertToBase } from "@/hooks/useConvertToBase";
import { useSettings } from "@/stores/useSettings";
import {
  removeBudgetLimit,
  setBudgetLimit,
  TOTAL_BUDGET_KEY,
} from "@/features/budget/service";
import { useFormatMoney, useT } from "@/i18n";
import { useCategoryName } from "@/i18n/categories";
import { sum } from "@/lib/utils";
import type { Currency } from "@/types";
import { toast } from "sonner";

export function BudgetPage() {
  const t = useT();
  const formatMoney = useFormatMoney();
  const categoryName = useCategoryName();
  const categories = useTopLevelCategories();
  const budgetMap = useBudgetMap();
  const expenses = useMonthExpenses();
  const defaultCurrency = useSettings((s) => s.settings.currency);
  const { convert } = useConvertToBase();
  const totalBudget = budgetMap.get(TOTAL_BUDGET_KEY);
  const totalTarget = totalBudget?.currency ?? defaultCurrency;

  const totalSpent = useMemo(
    () =>
      sum(
        expenses.map((e) => convert(e.amount, e.currency, totalTarget)),
      ),
    [expenses, convert, totalTarget],
  );

  const spentByCategory = useMemo(() => {
    const out = new Map<string, number>();
    for (const e of expenses) {
      const limit = budgetMap.get(e.categoryId);
      const target = limit?.currency ?? defaultCurrency;
      out.set(
        e.categoryId,
        (out.get(e.categoryId) ?? 0) +
          convert(e.amount, e.currency, target),
      );
    }
    return out;
  }, [expenses, budgetMap, defaultCurrency, convert]);

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title={t("budget.title")}
        description={t("budget.description")}
      />

      <Card>
        <CardContent className="p-5 space-y-4">
          <div>
            <Label>{t("budget.monthly_label")}</Label>
            <p className="text-xs text-muted-foreground mt-1">
              {t("budget.monthly_caption")}
            </p>
          </div>
          <BudgetEditor
            label={t("budget.total")}
            currentLimit={totalBudget?.monthlyLimit ?? 0}
            spent={totalSpent}
            defaultCurrency={defaultCurrency}
            savedCurrency={totalBudget?.currency}
            onSave={async (value, cur) => {
              await setBudgetLimit(TOTAL_BUDGET_KEY, value, cur);
              toast.success(t("budget.toast_updated"));
            }}
            onClear={
              totalBudget
                ? async () => {
                    await removeBudgetLimit(TOTAL_BUDGET_KEY);
                    toast(t("budget.toast_removed"));
                  }
                : undefined
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-5">
          <div>
            <div className="text-sm font-semibold">
              {t("budget.per_category")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("budget.per_category_caption")}
            </p>
          </div>
          <div className="space-y-4">
            {categories.map((c) => {
              const budget = budgetMap.get(c.id);
              const spent = spentByCategory.get(c.id) ?? 0;
              return (
                <div key={c.id} className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `${c.color}26`,
                        color: c.color,
                      }}
                    >
                      <Icon name={c.icon} className="h-4 w-4" />
                    </div>
                    <div className="flex-1 text-sm font-medium">
                      {categoryName(c)}
                    </div>
                    <PerCategoryEditor
                      categoryId={c.id}
                      currentLimit={budget?.monthlyLimit ?? 0}
                      defaultCurrency={defaultCurrency}
                      savedCurrency={budget?.currency}
                      onClear={
                        budget
                          ? async () => {
                              await removeBudgetLimit(c.id);
                              toast(t("budget.toast_limit_removed"));
                            }
                          : undefined
                      }
                    />
                  </div>
                  {budget ? (
                    <BudgetProgress
                      size="sm"
                      spent={spent}
                      limit={budget.monthlyLimit}
                      currency={budget.currency}
                    />
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      {t("budget.spent_so_far", {
                        amount: formatMoney(spent, defaultCurrency),
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BudgetEditor({
  label,
  currentLimit,
  spent,
  defaultCurrency,
  savedCurrency,
  onSave,
  onClear,
}: {
  label: string;
  currentLimit: number;
  spent: number;
  defaultCurrency: Currency;
  savedCurrency?: Currency;
  onSave: (value: number, currency: Currency) => Promise<void> | void;
  onClear?: () => Promise<void> | void;
}) {
  const t = useT();
  const [val, setVal] = useState(
    currentLimit > 0 ? currentLimit.toString() : "",
  );
  const [currency, setCurrency] = useState<Currency>(
    savedCurrency ?? defaultCurrency,
  );

  useEffect(() => {
    setCurrency(savedCurrency ?? defaultCurrency);
  }, [savedCurrency, defaultCurrency]);

  useEffect(() => {
    setVal(currentLimit > 0 ? currentLimit.toString() : "");
  }, [currentLimit]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="number"
          inputMode="decimal"
          className="min-w-[8rem] flex-1"
          placeholder={t("budget.placeholder_overall")}
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
        <CurrencySelector value={currency} onValueChange={setCurrency} />
        <Button
          onClick={() => {
            const n = Number(val);
            if (Number.isFinite(n) && n > 0) onSave(n, currency);
          }}
        >
          <Save className="h-4 w-4" />
          {t("common.save")}
        </Button>
        {onClear && (
          <Button variant="outline" size="icon" onClick={() => onClear()}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      {currentLimit > 0 && (
        <BudgetProgress
          label={label}
          spent={spent}
          limit={currentLimit}
          currency={savedCurrency ?? currency}
        />
      )}
    </div>
  );
}

function PerCategoryEditor({
  categoryId,
  currentLimit,
  defaultCurrency,
  savedCurrency,
  onClear,
}: {
  categoryId: string;
  currentLimit: number;
  defaultCurrency: Currency;
  savedCurrency?: Currency;
  onClear?: () => Promise<void> | void;
}) {
  const [val, setVal] = useState(
    currentLimit > 0 ? currentLimit.toString() : "",
  );
  const [currency, setCurrency] = useState<Currency>(
    savedCurrency ?? defaultCurrency,
  );

  useEffect(() => {
    setCurrency(savedCurrency ?? defaultCurrency);
  }, [savedCurrency, defaultCurrency]);

  useEffect(() => {
    setVal(currentLimit > 0 ? currentLimit.toString() : "");
  }, [currentLimit]);

  return (
    <div className="flex items-center gap-1.5">
      <Input
        type="number"
        inputMode="decimal"
        className="h-8 w-20 text-right text-sm"
        placeholder="—"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={async () => {
          const n = Number(val);
          if (Number.isFinite(n) && n > 0) {
            await setBudgetLimit(categoryId, n, currency);
          }
        }}
      />
      <CurrencySelector
        value={currency}
        onValueChange={setCurrency}
        className="h-8 px-2"
      />
      {onClear && (
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => onClear()}
          aria-label="Clear limit"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
