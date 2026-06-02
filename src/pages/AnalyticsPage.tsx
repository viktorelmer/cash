import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Coffee,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { AnalyticsCard } from "@/components/shared/AnalyticsCard";
import { Icon } from "@/components/ui/icon";
import {
  useCategoryMap,
  useExpenses,
  useIncomes,
  useActiveSubscriptions,
  useMonthExpenses,
  useMonthlySubscriptionsCost,
} from "@/hooks/useData";
import { useConvertToBase } from "@/hooks/useConvertToBase";
import { useSettings } from "@/stores/useSettings";
import {
  buildDailySeries,
  buildMonthSummary,
  buildMonthlyTrend,
  buildWeeklySummary,
  detectUnnecessarySpending,
  topCategories,
} from "@/features/analytics/computations";
import {
  useFormatDate,
  useFormatMoney,
  useT,
} from "@/i18n";
import { useCategoryName } from "@/i18n/categories";
import { endOfMonth, startOfMonth, subMonths } from "@/lib/date";
import { computeMonthEndForecast } from "@/lib/forecast";
import { sum } from "@/lib/utils";

export function AnalyticsPage() {
  const t = useT();
  const formatMoney = useFormatMoney();
  const formatLocalized = useFormatDate();
  const categoryName = useCategoryName();
  const expenses = useExpenses();
  const incomes = useIncomes();
  const monthExpenses = useMonthExpenses();
  const activeSubs = useActiveSubscriptions();
  const categoryMap = useCategoryMap();
  const currency = useSettings((s) => s.settings.currency);
  const weekStartsOn = useSettings((s) => s.settings.weekStartsOn);
  const subsMonthly = useMonthlySubscriptionsCost();
  const { convertToBase } = useConvertToBase();

  const monthlyTrend = useMemo(
    () => buildMonthlyTrend(expenses, incomes, convertToBase, 6),
    [expenses, incomes, convertToBase],
  );

  const monthlyChartData = useMemo(
    () =>
      monthlyTrend.map((p) => ({
        ...p,
        label: formatLocalized(p.date, "LLL"),
      })),
    [monthlyTrend, formatLocalized],
  );

  const daily = useMemo(
    () => buildDailySeries(expenses, convertToBase, 30),
    [expenses, convertToBase],
  );

  const currentMonth = useMemo(
    () => buildMonthSummary(new Date(), expenses, incomes, convertToBase),
    [expenses, incomes, convertToBase],
  );

  const previousMonth = useMemo(
    () =>
      buildMonthSummary(
        subMonths(new Date(), 1),
        expenses,
        incomes,
        convertToBase,
      ),
    [expenses, incomes, convertToBase],
  );

  const monthDelta = useMemo(() => {
    if (previousMonth.spent === 0) return 0;
    return (
      ((currentMonth.spent - previousMonth.spent) / previousMonth.spent) * 100
    );
  }, [previousMonth, currentMonth]);

  const week = useMemo(
    () => buildWeeklySummary(expenses, convertToBase, weekStartsOn),
    [expenses, convertToBase, weekStartsOn],
  );

  const topCats = useMemo(
    () => topCategories(monthExpenses, convertToBase, 5),
    [monthExpenses, convertToBase],
  );

  const flags = useMemo(
    () => detectUnnecessarySpending(monthExpenses, convertToBase),
    [monthExpenses, convertToBase],
  );

  const projectedMonthSpend = useMemo(
    () =>
      computeMonthEndForecast(
        monthExpenses,
        activeSubs,
        convertToBase,
        new Date(),
      ),
    [monthExpenses, activeSubs, convertToBase],
  );

  const subsShare = useMemo(() => {
    const denom = Math.max(projectedMonthSpend, previousMonth.spent);
    return denom > 0 ? (subsMonthly / denom) * 100 : 0;
  }, [subsMonthly, projectedMonthSpend, previousMonth.spent]);

  const avg30 = useMemo(() => {
    const total = sum(daily.map((d) => d.spent));
    return total / Math.max(daily.length, 1);
  }, [daily]);

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title={t("analytics.title")}
        description={t("analytics.description")}
      />

      <div className="grid grid-cols-2 gap-3">
        <AnalyticsCard
          title={t("analytics.this_month")}
          value={formatMoney(currentMonth.spent, currency)}
          trend={{
            value: Number(monthDelta.toFixed(1)),
            positiveIsGood: false,
          }}
          description={t("analytics.vs_last", {
            amount: formatMoney(previousMonth.spent, currency),
          })}
          icon={monthDelta > 0 ? ArrowUpRight : ArrowDownRight}
        />
        <AnalyticsCard
          title={t("analytics.this_week")}
          value={formatMoney(week.spent, currency)}
          trend={{
            value: Number(week.delta.toFixed(1)),
            positiveIsGood: false,
          }}
          description={t("analytics.vs_prior")}
        />
        <AnalyticsCard
          title={t("analytics.daily_avg")}
          value={formatMoney(avg30, currency)}
          description={t("analytics.daily_avg_caption")}
        />
        <AnalyticsCard
          title={t("analytics.subscriptions")}
          value={`${Math.min(Math.round(subsShare), 999)}%`}
          description={t("analytics.subscriptions_caption")}
        />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">
                {t("analytics.last_30_days")}
              </div>
              <div className="text-xs text-muted-foreground">
                {t("analytics.daily_spending")}
              </div>
            </div>
          </div>
          <div className="mt-3 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={daily}
                margin={{ left: 0, right: 0, top: 4, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="spend" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="hsl(var(--foreground))"
                      stopOpacity={0.18}
                    />
                    <stop
                      offset="100%"
                      stopColor="hsl(var(--foreground))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => formatLocalized(new Date(v), "d")}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ stroke: "hsl(var(--border))" }}
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => formatMoney(v, currency)}
                  labelFormatter={(v) =>
                    formatLocalized(new Date(v as number), "EEE, d MMM")
                  }
                />
                <Area
                  type="monotone"
                  dataKey="spent"
                  stroke="hsl(var(--foreground))"
                  strokeWidth={2}
                  fill="url(#spend)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">
                {t("analytics.monthly_trend")}
              </div>
              <div className="text-xs text-muted-foreground">
                {t("analytics.income_vs_spend")}
              </div>
            </div>
          </div>
          <div className="mt-3 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyChartData}
                margin={{ left: 0, right: 0, top: 4, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(v: number, k) => [
                    formatMoney(v, currency),
                    k === "spent"
                      ? t("analytics.spent_label")
                      : t("analytics.income_label"),
                  ]}
                />
                <Bar
                  dataKey="income"
                  radius={[6, 6, 0, 0]}
                  fill="hsl(var(--success))"
                />
                <Bar
                  dataKey="spent"
                  radius={[6, 6, 0, 0]}
                  fill="hsl(var(--foreground))"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold">
                {t("analytics.top_categories")}
              </div>
              <div className="text-xs text-muted-foreground">
                {t("analytics.top_categories_caption")}
              </div>
            </div>
          </div>
          {topCats.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              {t("analytics.no_expenses_month")}
            </div>
          ) : (
            <ul className="space-y-2.5">
              {topCats.map((row) => {
                const cat = categoryMap.get(row.categoryId);
                return (
                  <li
                    key={row.categoryId}
                    className="flex items-center gap-3"
                  >
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-xl"
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
                      <div className="mt-1 h-1.5 rounded-full bg-muted">
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

      {flags.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <div className="text-sm font-semibold">
                {t("analytics.leaks_title")}
              </div>
            </div>
            <ul className="space-y-2">
              {flags.map((f) => (
                <li
                  key={f.reason}
                  className="flex items-center gap-3 rounded-xl bg-muted/40 p-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning/10 text-warning">
                    <Coffee className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {t(`analytics.leak_reasons.${f.reason}`)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("analytics.leak_count_purchases", {
                        count: f.count,
                      })}
                    </div>
                  </div>
                  <div className="num text-sm font-semibold">
                    {formatMoney(f.amount, currency)}
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              {t("analytics.leaks_footer")}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
