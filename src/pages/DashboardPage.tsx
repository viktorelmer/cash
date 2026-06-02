import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  ChevronRight,
  Flame,
  Repeat,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/layout/PageHeader";
import { MonthlySummary } from "@/components/shared/MonthlySummary";
import { GoalCard } from "@/components/shared/GoalCard";
import { ExpenseCard } from "@/components/shared/ExpenseCard";
import { ConvertedMoney } from "@/components/shared/ConvertedMoney";
import { BudgetProgress } from "@/components/shared/BudgetProgress";
import { AnalyticsCard } from "@/components/shared/AnalyticsCard";
import { Icon } from "@/components/ui/icon";
import { useSettings } from "@/stores/useSettings";
import {
  useActiveSubscriptions,
  useBudgetMap,
  useCategoryMap,
  useExpenses,
  useGoals,
  useMonthExpenses,
  useMonthIncomes,
  useMonthlySubscriptionsCost,
} from "@/hooks/useData";
import {
  useFormatMoney,
  useShortDateLabel,
  useT,
} from "@/i18n";
import { useCategoryName } from "@/i18n/categories";
import { sum } from "@/lib/utils";
import { endOfMonth, isSameDay, startOfMonth } from "@/lib/date";
import { computeMonthEndForecast } from "@/lib/forecast";
import {
  buildMonthSummary,
  topCategories,
} from "@/features/analytics/computations";
import { TOTAL_BUDGET_KEY } from "@/features/budget/service";
import { cn } from "@/lib/utils";
import { useConvertToBase } from "@/hooks/useConvertToBase";
import { useUi } from "@/stores/useUi";

export function DashboardPage() {
  const t = useT();
  const formatMoney = useFormatMoney();
  const shortDateLabel = useShortDateLabel();
  const categoryName = useCategoryName();
  const currency = useSettings((s) => s.settings.currency);
  const monthExpenses = useMonthExpenses();
  const monthIncomes = useMonthIncomes();
  const allExpenses = useExpenses();
  const goals = useGoals();
  const subs = useActiveSubscriptions();
  const subsMonthly = useMonthlySubscriptionsCost();
  const budgetMap = useBudgetMap();
  const categoryMap = useCategoryMap();
  const openAdd = useUi((s) => s.openAddExpense);
  const { convertToBase } = useConvertToBase();

  const summary = useMemo(
    () => buildMonthSummary(new Date(), monthExpenses, monthIncomes, convertToBase),
    [monthExpenses, monthIncomes, convertToBase],
  );

  const today = new Date();
  const todaySpent = useMemo(
    () =>
      sum(
        monthExpenses
          .filter((e) => isSameDay(e.date, today))
          .map((e) => convertToBase(e.amount, e.currency)),
      ),
    [monthExpenses, today, convertToBase],
  );

  const daysLeft = useMemo(() => {
    const end = endOfMonth(today);
    return Math.max(
      1,
      Math.ceil((end.getTime() - today.getTime()) / 86400000),
    );
  }, [today]);

  const totalBudget = budgetMap.get(TOTAL_BUDGET_KEY);
  const safeToSpend = totalBudget
    ? Math.max(totalBudget.monthlyLimit - summary.spent, 0) / daysLeft
    : null;

  const top = useMemo(
    () => topCategories(monthExpenses, convertToBase, 4),
    [monthExpenses, convertToBase],
  );

  const nearestSub = subs[0];

  const projectedSpend = useMemo(
    () =>
      computeMonthEndForecast(
        monthExpenses,
        subs,
        convertToBase,
        today,
      ),
    [monthExpenses, subs, convertToBase, today],
  );

  const recent = allExpenses.slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t("dashboard.title")}
        description={t("dashboard.description")}
      />

      <MonthlySummary />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <AnalyticsCard
          title={t("dashboard.today")}
          value={formatMoney(todaySpent, currency)}
          description={t("dashboard.today_caption")}
          icon={Flame}
          help={{
            title: t("dashboard.help.today_title"),
            description: t("dashboard.help.today_body"),
            ariaLabel: t("dashboard.help.aria_label"),
          }}
        />
        <AnalyticsCard
          title={t("dashboard.forecast")}
          value={formatMoney(projectedSpend, currency)}
          description={t("dashboard.forecast_caption", { days: daysLeft })}
          icon={TrendingDown}
          help={{
            title: t("dashboard.help.forecast_title"),
            description: t("dashboard.help.forecast_body"),
            ariaLabel: t("dashboard.help.aria_label"),
          }}
        />
        <AnalyticsCard
          title={t("dashboard.subscriptions")}
          value={formatMoney(subsMonthly, currency)}
          description={t("dashboard.subscriptions_caption", {
            count: subs.length,
          })}
          icon={Repeat}
          help={{
            title: t("dashboard.help.subscriptions_title"),
            description: t("dashboard.help.subscriptions_body"),
            ariaLabel: t("dashboard.help.aria_label"),
          }}
        />
        <AnalyticsCard
          title={t("dashboard.safe_per_day")}
          value={
            safeToSpend !== null ? formatMoney(safeToSpend, currency) : "—"
          }
          description={
            safeToSpend !== null
              ? t("dashboard.safe_per_day_active")
              : t("dashboard.safe_per_day_inactive")
          }
          icon={Sparkles}
          help={{
            title: t("dashboard.help.safe_per_day_title"),
            description: t("dashboard.help.safe_per_day_body"),
            ariaLabel: t("dashboard.help.aria_label"),
          }}
        />
      </div>

      {totalBudget && (
        <Card>
          <CardContent className="p-5">
            <BudgetProgress
              label={t("dashboard.monthly_budget")}
              caption={t("dashboard.budget_planned", {
                amount: formatMoney(
                  totalBudget.monthlyLimit,
                  totalBudget.currency,
                ),
              })}
              spent={summary.spent}
              limit={totalBudget.monthlyLimit}
              currency={totalBudget.currency}
            />
          </CardContent>
        </Card>
      )}

      <section className="space-y-3">
        <SectionTitle
          title={t("dashboard.section_goals")}
          action={
            <Link to="/goals" className="text-xs text-muted-foreground tap">
              {t("dashboard.see_all")}
            </Link>
          }
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {goals.slice(0, 2).map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onClick={() => {
                /* navigate via global router */
              }}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle
          title={t("dashboard.section_top_categories")}
          action={
            <Link
              to="/analytics"
              className="text-xs text-muted-foreground tap"
            >
              {t("dashboard.insights")}
            </Link>
          }
        />
        <Card>
          <CardContent className="p-3">
            {top.length === 0 ? (
              <div className="px-3 py-4 text-sm text-muted-foreground">
                {t("dashboard.no_expenses_month")}
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {top.map((row) => {
                  const cat = categoryMap.get(row.categoryId);
                  return (
                    <li
                      key={row.categoryId}
                      className="flex items-center gap-3 px-2 py-2.5"
                    >
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{
                          backgroundColor: `${cat?.color ?? "#71717A"}26`,
                          color: cat?.color ?? "#71717A",
                        }}
                      >
                        <Icon
                          name={cat?.icon ?? "Tag"}
                          className="h-4 w-4"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">
                            {categoryName(cat ?? null)}
                          </span>
                          <span className="num font-semibold">
                            {formatMoney(row.total, currency)}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.round(row.share * 100)}%`,
                              backgroundColor: cat?.color ?? "#71717A",
                            }}
                          />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      {nearestSub && (
        <section className="space-y-3">
          <SectionTitle
            title={t("dashboard.section_up_next")}
            action={
              <Link
                to="/subscriptions"
                className="text-xs text-muted-foreground tap"
              >
                {t("dashboard.subscriptions_link")}
              </Link>
            }
          />
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{nearestSub.name}</div>
                <div className="text-xs text-muted-foreground">
                  {t("dashboard.renews_on", {
                    date: shortDateLabel(nearestSub.nextPaymentDate),
                  })}
                </div>
              </div>
              <ConvertedMoney
                amount={nearestSub.amount}
                currency={nearestSub.currency}
                amountClassName="text-sm font-semibold"
              />
            </CardContent>
          </Card>
        </section>
      )}

      <section className="space-y-3">
        <SectionTitle
          title={t("dashboard.section_recent")}
          action={
            <Link
              to="/expenses"
              className="text-xs text-muted-foreground tap"
            >
              {t("dashboard.all_expenses")}
            </Link>
          }
        />
        <Card>
          <CardContent className="p-2">
            {recent.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                {t("dashboard.no_expenses_first")}
              </div>
            ) : (
              recent.map((e, i) => {
                const cat = categoryMap.get(e.categoryId);
                const sub = e.subcategoryId
                  ? categoryMap.get(e.subcategoryId)
                  : null;
                return (
                  <div key={e.id}>
                    <ExpenseCard
                      expense={e}
                      category={cat}
                      subcategory={sub}
                    />
                    {i < recent.length - 1 && (
                      <Separator className="my-0.5" />
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </section>

      <div className="flex justify-center pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => openAdd()}
          className="gap-2 rounded-full"
        >
          {t("dashboard.add_expense_cta")}
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn("flex items-end justify-between")}>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {action ? (
        <span className="flex items-center gap-1">
          {action}
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        </span>
      ) : null}
    </div>
  );
}
