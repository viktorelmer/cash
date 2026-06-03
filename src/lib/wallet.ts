import type { AppSettings, Currency, Expense, Income } from "@/types";
import { incomeNetAmount } from "@/features/income/amounts";
import { convertAmount } from "@/lib/exchange";
import { sum } from "@/lib/utils";

export function netIncomeAmount(income: Income): number {
  return incomeNetAmount(income);
}

function toBase(
  amount: number,
  from: Currency,
  base: Currency,
  rates: AppSettings["exchangeRates"],
): number {
  return convertAmount(amount, from, base, base, rates);
}

export function computeWalletBalance(
  settings: Pick<
    AppSettings,
    | "startingBalance"
    | "startingBalanceAt"
    | "currency"
    | "exchangeRates"
  >,
  incomes: Income[],
  expenses: Expense[],
): number | null {
  if (
    settings.startingBalance === null ||
    settings.startingBalance === undefined ||
    settings.startingBalanceAt === null ||
    settings.startingBalanceAt === undefined
  ) {
    return null;
  }

  const anchor = settings.startingBalanceAt;
  const base = settings.currency;
  const rates = settings.exchangeRates;

  const incomeSince = sum(
    incomes
      .filter((i) => i.date >= anchor)
      .map((i) => toBase(netIncomeAmount(i), i.currency, base, rates)),
  );
  const spentSince = sum(
    expenses
      .filter((e) => e.date >= anchor)
      .map((e) => toBase(e.amount, e.currency, base, rates)),
  );

  return settings.startingBalance + incomeSince - spentSince;
}
