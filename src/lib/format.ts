import type { Currency, Language } from "@/types";

const symbolMap: Record<Currency, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  PLN: "zł",
  CHF: "Fr",
  SEK: "kr",
  NOK: "kr",
  BYN: "Br",
  RUB: "₽",
};

export function currencySymbol(currency: Currency): string {
  return symbolMap[currency] ?? currency;
}

const NUMBER_LOCALES: Record<Language, string> = {
  en: "en-DE",
  be: "be-BY",
  ru: "ru-RU",
};

function numberLocaleFor(language?: Language): string {
  return language ? NUMBER_LOCALES[language] ?? "en-DE" : "en-DE";
}

export function formatMoney(
  amount: number,
  currency: Currency = "EUR",
  options: { compact?: boolean; sign?: boolean; language?: Language } = {},
): string {
  const { compact = false, sign = false, language } = options;
  const abs = Math.abs(amount);
  const fractionDigits =
    abs >= 1000 && compact
      ? 0
      : Number.isInteger(amount)
      ? 0
      : 2;

  const formatter = new Intl.NumberFormat(numberLocaleFor(language), {
    style: "decimal",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: 2,
  });

  const symbol = currencySymbol(currency);
  const signPrefix = sign && amount > 0 ? "+" : amount < 0 ? "−" : "";

  return `${signPrefix}${symbol}${formatter.format(abs)}`;
}

export function formatCompact(value: number, language?: Language): string {
  return new Intl.NumberFormat(numberLocaleFor(language), {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatPercent(
  value: number,
  fractionDigits = 0,
  language?: Language,
): string {
  return `${value.toLocaleString(numberLocaleFor(language), {
    maximumFractionDigits: fractionDigits,
  })}%`;
}
