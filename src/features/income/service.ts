import { db } from "@/lib/db";
import type { Income } from "@/types";
import { uid } from "@/lib/utils";

export type IncomeDraft = Omit<Income, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
};

export async function createIncome(draft: IncomeDraft): Promise<Income> {
  const now = Date.now();
  const income: Income = {
    id: draft.id ?? uid("inc"),
    amount: Number(draft.amount),
    bonusAmount: Math.max(0, Number(draft.bonusAmount ?? 0)),
    currency: draft.currency,
    source: draft.source,
    type: draft.type,
    date: draft.date ?? now,
    recurring: draft.recurring ?? null,
    taxEnabled: !!draft.taxEnabled,
    taxRate: draft.taxEnabled ? Number(draft.taxRate ?? 10) : 0,
    note: draft.note ?? "",
    createdAt: now,
    updatedAt: now,
  };
  await db.incomes.put(income);
  return income;
}

export async function updateIncome(
  id: string,
  patch: Partial<Income>,
): Promise<void> {
  await db.incomes.update(id, { ...patch, updatedAt: Date.now() });
}

export async function deleteIncome(id: string): Promise<void> {
  await db.incomes.delete(id);
}
