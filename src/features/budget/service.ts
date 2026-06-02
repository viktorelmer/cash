import { db } from "@/lib/db";
import type { BudgetLimit, Currency } from "@/types";
import { uid } from "@/lib/utils";

export const TOTAL_BUDGET_KEY = "__total__";

export async function setBudgetLimit(
  categoryId: string,
  monthlyLimit: number,
  currency: Currency,
): Promise<void> {
  const existing = await db.budgets
    .where("categoryId")
    .equals(categoryId)
    .first();

  if (existing) {
    await db.budgets.update(existing.id, {
      monthlyLimit,
      currency,
      updatedAt: Date.now(),
    });
    return;
  }

  const limit: BudgetLimit = {
    id: uid("bud"),
    categoryId,
    monthlyLimit,
    currency,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await db.budgets.put(limit);
}

export async function removeBudgetLimit(categoryId: string): Promise<void> {
  const existing = await db.budgets
    .where("categoryId")
    .equals(categoryId)
    .first();
  if (existing) await db.budgets.delete(existing.id);
}
