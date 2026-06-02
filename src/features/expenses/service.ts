import { db } from "@/lib/db";
import type { Expense } from "@/types";
import { uid } from "@/lib/utils";

export type ExpenseDraft = Omit<Expense, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
};

export async function createExpense(draft: ExpenseDraft): Promise<Expense> {
  const now = Date.now();
  const expense: Expense = {
    id: draft.id ?? uid("exp"),
    amount: Number(draft.amount),
    currency: draft.currency,
    categoryId: draft.categoryId,
    subcategoryId: draft.subcategoryId ?? null,
    tags: draft.tags ?? [],
    note: draft.note ?? "",
    date: draft.date ?? now,
    createdAt: now,
    updatedAt: now,
    subscriptionId: draft.subscriptionId ?? null,
    presetId: draft.presetId ?? null,
  };
  await db.expenses.put(expense);
  return expense;
}

export async function updateExpense(
  id: string,
  patch: Partial<Expense>,
): Promise<void> {
  await db.expenses.update(id, { ...patch, updatedAt: Date.now() });
}

export async function deleteExpense(id: string): Promise<void> {
  await db.expenses.delete(id);
}

export async function getExpense(id: string): Promise<Expense | undefined> {
  return db.expenses.get(id);
}

export async function listExpensesBetween(
  start: number,
  end: number,
): Promise<Expense[]> {
  return db.expenses.where("date").between(start, end, true, true).toArray();
}
