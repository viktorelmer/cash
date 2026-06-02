import type { Currency, ExchangeRates } from "@/types";

export type { ExchangeRates };

export const SUPPORTED_CURRENCIES: Currency[] = [
  "EUR",
  "USD",
  "GBP",
  "PLN",
  "CHF",
  "SEK",
  "NOK",
  "BYN",
];

const RATES_TTL_MS = 24 * 60 * 60 * 1000;
const FRANKFURTER_API = "https://api.frankfurter.dev/v2";

interface FrankfurterRateRow {
  date: string;
  base: string;
  quote: string;
  rate: number;
}

export function isRatesStale(updatedAt: number | null | undefined): boolean {
  if (!updatedAt) return true;
  return Date.now() - updatedAt > RATES_TTL_MS;
}

export async function fetchExchangeRates(
  base: Currency,
): Promise<ExchangeRates> {
  const quotes = SUPPORTED_CURRENCIES.filter((c) => c !== base).join(",");
  const url = `${FRANKFURTER_API}/rates?base=${base}&quotes=${quotes}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Exchange rate fetch failed (${res.status})`);
  }
  const rows = (await res.json()) as FrankfurterRateRow[];
  const rates: ExchangeRates = { [base]: 1 };
  for (const row of rows) {
    if (row.base !== base) continue;
    const quote = row.quote as Currency;
    if (
      SUPPORTED_CURRENCIES.includes(quote) &&
      quote !== base &&
      typeof row.rate === "number" &&
      row.rate > 0
    ) {
      rates[quote] = row.rate;
    }
  }
  return rates;
}

/**
 * Convert `amount` from `from` to `to` using rates relative to `base`.
 * Example: base EUR, rates.USD = 1.08 → 1 EUR = 1.08 USD.
 */
export function convertAmount(
  amount: number,
  from: Currency,
  to: Currency,
  base: Currency,
  rates: ExchangeRates | null | undefined,
): number {
  if (from === to) return amount;
  if (!rates || amount === 0) return amount;

  const toBase = (value: number, currency: Currency): number | null => {
    if (currency === base) return value;
    const rate = rates[currency];
    if (!rate || rate <= 0) return null;
    return value / rate;
  };

  const fromBase = (value: number, currency: Currency): number | null => {
    if (currency === base) return value;
    const rate = rates[currency];
    if (!rate || rate <= 0) return null;
    return value * rate;
  };

  const inBase = toBase(amount, from);
  if (inBase === null) return amount;
  const result = fromBase(inBase, to);
  if (result === null) return amount;
  return Math.round(result * 100) / 100;
}
