import type { Currency, Expense, Income } from "@/types";
import { sum } from "@/lib/utils";
import {
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from "@/lib/date";

export interface MonthSummary {
  start: number;
  end: number;
  spent: number;
  income: number;
  net: number;
  count: number;
}

export type ToBaseCurrency = (amount: number, from: Currency) => number;

export function buildMonthSummary(
  date: Date,
  expenses: Expense[],
  incomes: Income[],
  toBase: ToBaseCurrency,
): MonthSummary {
  const start = startOfMonth(date).getTime();
  const end = endOfMonth(date).getTime();
  const monthExpenses = expenses.filter((e) => e.date >= start && e.date <= end);
  const monthIncomes = incomes.filter((i) => i.date >= start && i.date <= end);
  const spent = sum(
    monthExpenses.map((e) => toBase(e.amount, e.currency)),
  );
  const grossIncome = sum(
    monthIncomes.map((i) => toBase(i.amount, i.currency)),
  );
  const tax = sum(
    monthIncomes
      .filter((i) => i.taxEnabled)
      .map((i) => toBase((i.amount * i.taxRate) / 100, i.currency)),
  );
  return {
    start,
    end,
    spent,
    income: grossIncome - tax,
    net: grossIncome - tax - spent,
    count: monthExpenses.length,
  };
}

export interface CategorySpend {
  categoryId: string;
  total: number;
  count: number;
  share: number;
}

export function topCategories(
  expenses: Expense[],
  toBase: ToBaseCurrency,
  limit = 5,
): CategorySpend[] {
  const totals = new Map<string, { total: number; count: number }>();
  for (const e of expenses) {
    const converted = toBase(e.amount, e.currency);
    const existing = totals.get(e.categoryId);
    if (existing) {
      existing.total += converted;
      existing.count += 1;
    } else {
      totals.set(e.categoryId, { total: converted, count: 1 });
    }
  }
  const totalAmount = sum(Array.from(totals.values()).map((t) => t.total));
  return Array.from(totals.entries())
    .map(([categoryId, t]) => ({
      categoryId,
      total: t.total,
      count: t.count,
      share: totalAmount > 0 ? t.total / totalAmount : 0,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

export interface DailySeries {
  date: number;
  spent: number;
}

export function buildDailySeries(
  expenses: Expense[],
  toBase: ToBaseCurrency,
  days = 30,
  endDate = new Date(),
): DailySeries[] {
  const series: DailySeries[] = [];
  const start = subDays(endDate, days - 1);
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    d.setHours(0, 0, 0, 0);
    const dayStart = d.getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000 - 1;
    const total = sum(
      expenses
        .filter((e) => e.date >= dayStart && e.date <= dayEnd)
        .map((e) => toBase(e.amount, e.currency)),
    );
    series.push({ date: dayStart, spent: total });
  }
  return series;
}

export interface MonthlyPoint {
  date: number;
  spent: number;
  income: number;
}

export function buildMonthlyTrend(
  expenses: Expense[],
  incomes: Income[],
  toBase: ToBaseCurrency,
  months = 6,
  reference = new Date(),
): MonthlyPoint[] {
  const out: MonthlyPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const ref = subMonths(reference, i);
    const start = startOfMonth(ref).getTime();
    const end = endOfMonth(ref).getTime();
    const monthExp = expenses.filter((e) => e.date >= start && e.date <= end);
    const monthInc = incomes.filter(
      (i2) => i2.date >= start && i2.date <= end,
    );
    out.push({
      date: start,
      spent: sum(monthExp.map((e) => toBase(e.amount, e.currency))),
      income:
        sum(monthInc.map((i2) => toBase(i2.amount, i2.currency))) -
        sum(
          monthInc
            .filter((i2) => i2.taxEnabled)
            .map((i2) =>
              toBase((i2.amount * i2.taxRate) / 100, i2.currency),
            ),
        ),
    });
  }
  return out;
}

export function buildWeeklySummary(
  expenses: Expense[],
  toBase: ToBaseCurrency,
  weekStartsOn: 0 | 1,
): { spent: number; previous: number; delta: number } {
  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn }).getTime();
  const end = endOfWeek(now, { weekStartsOn }).getTime();
  const prevStart = start - 7 * 24 * 60 * 60 * 1000;
  const prevEnd = start - 1;

  const spent = sum(
    expenses
      .filter((e) => e.date >= start && e.date <= end)
      .map((e) => toBase(e.amount, e.currency)),
  );
  const previous = sum(
    expenses
      .filter((e) => e.date >= prevStart && e.date <= prevEnd)
      .map((e) => toBase(e.amount, e.currency)),
  );
  const delta = previous > 0 ? ((spent - previous) / previous) * 100 : 0;
  return { spent, previous, delta };
}

export type LeakReason = "coffee" | "delivery" | "taxi";

export interface UnnecessaryFlag {
  reason: LeakReason;
  amount: number;
  count: number;
  categoryId?: string;
  subcategoryId?: string;
}

export function detectUnnecessarySpending(
  expenses: Expense[],
  toBase: ToBaseCurrency,
): UnnecessaryFlag[] {
  const out: UnnecessaryFlag[] = [];

  const candidates: Array<{ id: string; reason: LeakReason }> = [
    { id: "cat_food_coffee", reason: "coffee" },
    { id: "cat_food_delivery", reason: "delivery" },
    { id: "cat_transport_taxi", reason: "taxi" },
  ];

  for (const { id, reason } of candidates) {
    const items = expenses.filter((e) => e.subcategoryId === id);
    if (items.length >= 4) {
      out.push({
        reason,
        amount: sum(items.map((e) => toBase(e.amount, e.currency))),
        count: items.length,
        subcategoryId: id,
      });
    }
  }

  return out.sort((a, b) => b.amount - a.amount);
}
