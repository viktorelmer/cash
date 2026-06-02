import { db } from "@/lib/db";
import type { Goal } from "@/types";
import { uid } from "@/lib/utils";
import { differenceInCalendarMonths } from "@/lib/date";

export type GoalDraft = Omit<Goal, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
};

export async function createGoal(draft: GoalDraft): Promise<Goal> {
  const now = Date.now();
  const goal: Goal = {
    id: draft.id ?? uid("goal"),
    name: draft.name,
    kind: draft.kind,
    targetAmount: Number(draft.targetAmount),
    savedAmount: Number(draft.savedAmount ?? 0),
    currency: draft.currency,
    deadline: draft.deadline ?? null,
    monthlyContribution: draft.monthlyContribution ?? null,
    icon: draft.icon,
    color: draft.color,
    note: draft.note ?? "",
    createdAt: now,
    updatedAt: now,
  };
  await db.goals.put(goal);
  return goal;
}

export async function updateGoal(
  id: string,
  patch: Partial<Goal>,
): Promise<void> {
  await db.goals.update(id, { ...patch, updatedAt: Date.now() });
}

export async function deleteGoal(id: string): Promise<void> {
  await db.goals.delete(id);
}

export async function contributeToGoal(
  id: string,
  amount: number,
): Promise<void> {
  const goal = await db.goals.get(id);
  if (!goal) return;
  const next = Math.max(0, goal.savedAmount + amount);
  await db.goals.update(id, { savedAmount: next, updatedAt: Date.now() });
}

export type GoalEtaKind = "deadline" | "by_monthly" | null;

export interface GoalForecast {
  remaining: number;
  monthsRemaining: number | null;
  monthlyRequired: number | null;
  progress: number; // 0..1
  onTrack: boolean | null;
  etaKind: GoalEtaKind;
}

export function forecastGoal(goal: Goal): GoalForecast {
  const remaining = Math.max(goal.targetAmount - goal.savedAmount, 0);
  const progress =
    goal.targetAmount > 0
      ? Math.min(goal.savedAmount / goal.targetAmount, 1)
      : 0;

  let monthsRemaining: number | null = null;
  let monthlyRequired: number | null = null;
  let onTrack: boolean | null = null;
  let etaKind: GoalEtaKind = null;

  if (goal.deadline) {
    const months = Math.max(
      1,
      differenceInCalendarMonths(new Date(goal.deadline), new Date()),
    );
    monthsRemaining = months;
    monthlyRequired = remaining / months;
    if (
      goal.monthlyContribution !== null &&
      goal.monthlyContribution !== undefined
    ) {
      onTrack = goal.monthlyContribution >= monthlyRequired;
    }
    etaKind = "deadline";
  } else if (goal.monthlyContribution && goal.monthlyContribution > 0) {
    const months = Math.ceil(remaining / goal.monthlyContribution);
    monthsRemaining = months;
    monthlyRequired = goal.monthlyContribution;
    etaKind = "by_monthly";
  }

  return {
    remaining,
    monthsRemaining,
    monthlyRequired,
    progress,
    onTrack,
    etaKind,
  };
}
