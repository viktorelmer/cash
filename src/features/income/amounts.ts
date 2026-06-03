import type { Income } from "@/types";

export function incomeBonusAmount(
  income: Pick<Income, "bonusAmount">,
): number {
  return Math.max(0, income.bonusAmount ?? 0);
}

export function incomeGross(income: Pick<Income, "amount" | "bonusAmount">): number {
  return income.amount + incomeBonusAmount(income);
}

export function incomeTaxAmount(income: Income): number {
  if (!income.taxEnabled) return 0;
  return (incomeGross(income) * income.taxRate) / 100;
}

export function incomeNetAmount(income: Income): number {
  return incomeGross(income) - incomeTaxAmount(income);
}
