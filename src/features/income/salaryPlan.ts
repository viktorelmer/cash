import { db } from "@/lib/db";
import type {
  Currency,
  IncomeType,
  SalaryPart,
  SalaryPlan,
} from "@/types";
import { uid } from "@/lib/utils";
import { createIncome } from "./service";

export type SalaryPlanDraft = Omit<
  SalaryPlan,
  "id" | "createdAt" | "updatedAt"
> & { id?: string };

export async function createSalaryPlan(
  draft: SalaryPlanDraft,
): Promise<SalaryPlan> {
  const now = Date.now();
  const plan: SalaryPlan = {
    id: draft.id ?? uid("sal"),
    name: draft.name,
    monthlyAmount: Number(draft.monthlyAmount),
    currency: draft.currency,
    taxEnabled: !!draft.taxEnabled,
    taxRate: draft.taxEnabled ? Number(draft.taxRate ?? 10) : 0,
    parts: draft.parts.map((p) => ({
      id: p.id || uid("salp"),
      label: p.label,
      paymentDay: clampDay(p.paymentDay),
      periodMonthOffset: p.periodMonthOffset,
      periodStartDay: clampDay(p.periodStartDay),
      periodEndDay: clampDay(p.periodEndDay),
    })),
    note: draft.note ?? "",
    active: draft.active ?? true,
    createdAt: now,
    updatedAt: now,
  };
  await db.salaryPlans.put(plan);
  return plan;
}

export async function updateSalaryPlan(
  id: string,
  patch: Partial<SalaryPlan>,
): Promise<void> {
  const next: Partial<SalaryPlan> = {
    ...patch,
    updatedAt: Date.now(),
  };
  if (patch.parts) {
    next.parts = patch.parts.map((p) => ({
      id: p.id || uid("salp"),
      label: p.label,
      paymentDay: clampDay(p.paymentDay),
      periodMonthOffset: p.periodMonthOffset,
      periodStartDay: clampDay(p.periodStartDay),
      periodEndDay: clampDay(p.periodEndDay),
    }));
  }
  await db.salaryPlans.update(id, next);
}

export async function deleteSalaryPlan(id: string): Promise<void> {
  await db.salaryPlans.delete(id);
}

function clampDay(day: number): number {
  if (!Number.isFinite(day)) return 1;
  return Math.max(1, Math.min(31, Math.round(day)));
}

export function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function workingDaysInRange(
  year: number,
  month: number,
  fromDay: number,
  toDay: number,
): number {
  const last = lastDayOfMonth(year, month);
  const start = Math.max(1, Math.min(fromDay, last));
  const end = Math.max(start, Math.min(toDay, last));
  let count = 0;
  for (let d = start; d <= end; d++) {
    const dow = new Date(year, month, d).getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

export function workingDaysInMonth(year: number, month: number): number {
  return workingDaysInRange(year, month, 1, lastDayOfMonth(year, month));
}

export interface SalaryPartCalculation {
  amount: number;
  totalWorkingDays: number;
  partWorkingDays: number;
  periodYear: number;
  periodMonth: number; // 0-based month index
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Calculate the pro-rated amount for a single salary part based on the
 * payment date and the working days in its declared period.
 */
export function calculateSalaryPart(
  plan: SalaryPlan,
  part: SalaryPart,
  paymentDate: Date,
): SalaryPartCalculation {
  const base = new Date(
    paymentDate.getFullYear(),
    paymentDate.getMonth() + part.periodMonthOffset,
    1,
  );
  const periodYear = base.getFullYear();
  const periodMonth = base.getMonth();
  const last = lastDayOfMonth(periodYear, periodMonth);
  const startDay = Math.max(1, Math.min(part.periodStartDay, last));
  const endDay = Math.max(startDay, Math.min(part.periodEndDay, last));
  const totalWorkingDays = workingDaysInMonth(periodYear, periodMonth);
  const partWorkingDays = workingDaysInRange(
    periodYear,
    periodMonth,
    startDay,
    endDay,
  );
  const ratio = totalWorkingDays > 0 ? partWorkingDays / totalWorkingDays : 0;
  const amount = Math.round(plan.monthlyAmount * ratio * 100) / 100;
  return {
    amount,
    totalWorkingDays,
    partWorkingDays,
    periodYear,
    periodMonth,
    periodStart: new Date(periodYear, periodMonth, startDay),
    periodEnd: new Date(periodYear, periodMonth, endDay),
  };
}

/**
 * Resolve the next payment date for a given salary part, anchored on `from`.
 * If the part's `paymentDay` has already passed in `from`'s month we move to
 * the next month so users always see an upcoming payment.
 */
export function nextPaymentDateFor(
  part: SalaryPart,
  from: Date = new Date(),
): Date {
  const year = from.getFullYear();
  const month = from.getMonth();
  const last = lastDayOfMonth(year, month);
  const targetDay = Math.min(part.paymentDay, last);
  const candidate = new Date(year, month, targetDay);
  if (candidate.getTime() < startOfDay(from).getTime()) {
    const nextMonth = new Date(year, month + 1, 1);
    const nm = nextMonth.getMonth();
    const ny = nextMonth.getFullYear();
    const nl = lastDayOfMonth(ny, nm);
    return new Date(ny, nm, Math.min(part.paymentDay, nl));
  }
  return candidate;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

interface LogPaymentArgs {
  plan: SalaryPlan;
  part: SalaryPart;
  paymentDate: Date;
  amount: number;
  source?: string;
  note?: string;
}

/**
 * Persist a salary payment as an Income entry. Returns the created income.
 */
export async function logSalaryPayment({
  plan,
  part,
  paymentDate,
  amount,
  source,
  note,
}: LogPaymentArgs) {
  const type: IncomeType = "salary";
  return createIncome({
    amount,
    currency: plan.currency,
    source: source ?? plan.name,
    type,
    date: paymentDate.getTime(),
    recurring: "monthly",
    taxEnabled: plan.taxEnabled,
    taxRate: plan.taxRate,
    note: note ?? part.label,
  });
}

export const DEFAULT_SALARY_PARTS: SalaryPart[] = [
  {
    id: "",
    label: "first",
    paymentDay: 10,
    periodMonthOffset: -1,
    periodStartDay: 16,
    periodEndDay: 31,
  },
  {
    id: "",
    label: "second",
    paymentDay: 25,
    periodMonthOffset: 0,
    periodStartDay: 1,
    periodEndDay: 15,
  },
];

export const DEFAULT_PLAN_DRAFT: SalaryPlanDraft = {
  name: "",
  monthlyAmount: 0,
  currency: "EUR" as Currency,
  taxEnabled: true,
  taxRate: 10,
  parts: DEFAULT_SALARY_PARTS,
  note: "",
  active: true,
};
