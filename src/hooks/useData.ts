import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import { db } from "@/lib/db";
import { endOfMonth, startOfMonth } from "@/lib/date";
import { useConvertToBase } from "@/hooks/useConvertToBase";
import { monthlyCostOf } from "@/lib/date";
import { sum } from "@/lib/utils";
import type {
  BudgetLimit,
  Category,
  Expense,
  ExpensePreset,
  Goal,
  Income,
  SalaryPlan,
  Subscription,
} from "@/types";

export function useAllCategories(): Category[] {
  return useLiveQuery(() => db.categories.toArray(), [], []) ?? [];
}

export function useTopLevelCategories(): Category[] {
  const all = useAllCategories();
  return useMemo(
    () =>
      all
        .filter((c) => c.parentId === null && !c.archivedAt)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [all],
  );
}

export function useSubcategories(parentId: string | null): Category[] {
  const all = useAllCategories();
  return useMemo(
    () =>
      all
        .filter((c) => c.parentId === parentId && !c.archivedAt)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [all, parentId],
  );
}

export function useCategoryMap(): Map<string, Category> {
  const all = useAllCategories();
  return useMemo(() => new Map(all.map((c) => [c.id, c])), [all]);
}

export function usePresets(): ExpensePreset[] {
  return (
    useLiveQuery(
      () => db.presets.orderBy("createdAt").reverse().toArray(),
      [],
      [],
    ) ?? []
  );
}

export function useGoals(): Goal[] {
  return (
    useLiveQuery(
      () => db.goals.orderBy("createdAt").reverse().toArray(),
      [],
      [],
    ) ?? []
  );
}

export function useSubscriptions(): Subscription[] {
  return (
    useLiveQuery(
      () => db.subscriptions.orderBy("nextPaymentDate").toArray(),
      [],
      [],
    ) ?? []
  );
}

export function useActiveSubscriptions(): Subscription[] {
  const all = useSubscriptions();
  return useMemo(() => all.filter((s) => s.active), [all]);
}

export function useBudgets(): BudgetLimit[] {
  return useLiveQuery(() => db.budgets.toArray(), [], []) ?? [];
}

export function useBudgetMap(): Map<string, BudgetLimit> {
  const all = useBudgets();
  return useMemo(() => new Map(all.map((b) => [b.categoryId, b])), [all]);
}

export function useIncomes(limit?: number): Income[] {
  return (
    useLiveQuery(
      () => {
        const q = db.incomes.orderBy("date").reverse();
        return limit ? q.limit(limit).toArray() : q.toArray();
      },
      [limit],
      [],
    ) ?? []
  );
}

export function useExpenses(limit?: number): Expense[] {
  return (
    useLiveQuery(
      () => {
        const q = db.expenses.orderBy("date").reverse();
        return limit ? q.limit(limit).toArray() : q.toArray();
      },
      [limit],
      [],
    ) ?? []
  );
}

export function useExpensesBetween(start: number, end: number): Expense[] {
  return (
    useLiveQuery(
      () =>
        db.expenses
          .where("date")
          .between(start, end, true, true)
          .reverse()
          .sortBy("date"),
      [start, end],
      [],
    ) ?? []
  );
}

export function useMonthExpenses(date: Date = new Date()): Expense[] {
  const start = startOfMonth(date).getTime();
  const end = endOfMonth(date).getTime();
  return useExpensesBetween(start, end);
}

export function useMonthIncomes(date: Date = new Date()): Income[] {
  const start = startOfMonth(date).getTime();
  const end = endOfMonth(date).getTime();
  return (
    useLiveQuery(
      () => db.incomes.where("date").between(start, end, true, true).toArray(),
      [start, end],
      [],
    ) ?? []
  );
}

export function useSalaryPlans(): SalaryPlan[] {
  return (
    useLiveQuery(
      () => db.salaryPlans.orderBy("createdAt").reverse().toArray(),
      [],
      [],
    ) ?? []
  );
}

export function useMonthlySubscriptionsCost(): number {
  const subs = useActiveSubscriptions();
  const { convertToBase } = useConvertToBase();
  return useMemo(
    () =>
      sum(
        subs.map((s) =>
          convertToBase(monthlyCostOf(s.amount, s.frequency), s.currency),
        ),
      ),
    [subs, convertToBase],
  );
}
