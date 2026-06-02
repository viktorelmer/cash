import { useCallback, useMemo } from "react";
import { convertAmount } from "@/lib/exchange";
import { useSettings } from "@/stores/useSettings";
import type { Currency } from "@/types";

export function useConvertToBase() {
  const base = useSettings((s) => s.settings.currency);
  const rates = useSettings((s) => s.settings.exchangeRates);

  const convert = useCallback(
    (amount: number, from: Currency, to: Currency = base): number =>
      convertAmount(amount, from, to, base, rates),
    [base, rates],
  );

  const convertToBase = useCallback(
    (amount: number, from: Currency): number => convert(amount, from, base),
    [base, convert],
  );

  const hasRates = useMemo(
    () => rates !== null && rates !== undefined && Object.keys(rates).length > 0,
    [rates],
  );

  return { base, rates, convert, convertToBase, hasRates };
}
