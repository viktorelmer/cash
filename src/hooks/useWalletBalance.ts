import { useMemo } from "react";
import { computeWalletBalance } from "@/lib/wallet";
import { useSettings } from "@/stores/useSettings";
import { useExpenses, useIncomes } from "@/hooks/useData";

export function useWalletBalance(): number | null {
  const settings = useSettings((s) => s.settings);
  const incomes = useIncomes();
  const expenses = useExpenses();

  return useMemo(
    () =>
      computeWalletBalance(
        {
          startingBalance: settings.startingBalance,
          startingBalanceAt: settings.startingBalanceAt,
          currency: settings.currency,
          exchangeRates: settings.exchangeRates,
        },
        incomes,
        expenses,
      ),
    [settings, incomes, expenses],
  );
}
