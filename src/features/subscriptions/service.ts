import { db } from "@/lib/db";
import type { Subscription } from "@/types";
import { uid } from "@/lib/utils";
import { advanceRecurring } from "@/lib/date";

export type SubscriptionDraft = Omit<
  Subscription,
  "id" | "createdAt" | "updatedAt"
> & {
  id?: string;
};

export async function createSubscription(
  draft: SubscriptionDraft,
): Promise<Subscription> {
  const now = Date.now();
  const sub: Subscription = {
    id: draft.id ?? uid("sub"),
    name: draft.name,
    amount: Number(draft.amount),
    currency: draft.currency,
    categoryId: draft.categoryId,
    frequency: draft.frequency,
    nextPaymentDate: draft.nextPaymentDate,
    startDate: draft.startDate ?? now,
    active: draft.active ?? true,
    note: draft.note ?? "",
    color: draft.color,
    icon: draft.icon,
    createdAt: now,
    updatedAt: now,
  };
  await db.subscriptions.put(sub);
  return sub;
}

export async function updateSubscription(
  id: string,
  patch: Partial<Subscription>,
): Promise<void> {
  await db.subscriptions.update(id, { ...patch, updatedAt: Date.now() });
}

export async function deleteSubscription(id: string): Promise<void> {
  await db.subscriptions.delete(id);
}

export async function logSubscriptionPayment(id: string): Promise<void> {
  const sub = await db.subscriptions.get(id);
  if (!sub) return;
  const nextDate = advanceRecurring(
    new Date(sub.nextPaymentDate),
    sub.frequency,
  ).getTime();
  await db.transaction("rw", db.subscriptions, db.expenses, async () => {
    await db.expenses.put({
      id: uid("exp"),
      amount: sub.amount,
      currency: sub.currency,
      categoryId: sub.categoryId,
      subcategoryId: null,
      tags: ["subscription"],
      note: sub.name,
      date: sub.nextPaymentDate,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      subscriptionId: sub.id,
      presetId: null,
    });
    await db.subscriptions.update(id, {
      nextPaymentDate: nextDate,
      updatedAt: Date.now(),
    });
  });
}

export async function toggleSubscriptionActive(id: string): Promise<void> {
  const sub = await db.subscriptions.get(id);
  if (!sub) return;
  await updateSubscription(id, { active: !sub.active });
}
