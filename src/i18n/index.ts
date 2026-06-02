import { useMemo } from "react";
import { format as formatDate, type Locale as DateFnsLocale } from "date-fns";
import {
  be as beLocale,
  enUS as enLocale,
  ru as ruLocale,
} from "date-fns/locale";

import { useSettings } from "@/stores/useSettings";
import type { Currency, Language } from "@/types";
import {
  formatMoney as formatMoneyBase,
  formatCompact as formatCompactBase,
  formatPercent as formatPercentBase,
} from "@/lib/format";

import { en } from "./locales/en";
import { be } from "./locales/be";
import { ru } from "./locales/ru";
import { LANGUAGES, type LanguageOption, type TranslateFn } from "./types";

export type { Language, LanguageOption };
export { LANGUAGES };

const dictionaries: Record<Language, unknown> = {
  en,
  be,
  ru,
};

const dateLocales: Record<Language, DateFnsLocale> = {
  en: enLocale,
  be: beLocale,
  ru: ruLocale,
};

function lookup(dict: unknown, path: string): unknown {
  const segments = path.split(".");
  let cursor: unknown = dict;
  for (const segment of segments) {
    if (cursor && typeof cursor === "object" && segment in (cursor as Record<string, unknown>)) {
      cursor = (cursor as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }
  }
  return cursor;
}

const beCardinal = new Intl.PluralRules("be-BY", { type: "cardinal" });
const enCardinal = new Intl.PluralRules("en-US", { type: "cardinal" });
const ruCardinal = new Intl.PluralRules("ru-RU", { type: "cardinal" });

function pluralCategory(language: Language, n: number): string {
  if (language === "be") return beCardinal.select(n);
  if (language === "ru") return ruCardinal.select(n);
  return enCardinal.select(n);
}

function applyPlurals(
  template: string,
  language: Language,
  vars: Record<string, string | number>,
): string {
  let out = "";
  let i = 0;
  while (i < template.length) {
    if (template[i] === "{") {
      const block = readBalancedBlock(template, i);
      if (block) {
        const inner = template.slice(i + 1, i + block.length - 1);
        const pluralMatch = inner.match(/^(\w+),\s*plural,\s*([\s\S]*)$/);
        if (pluralMatch) {
          const varName = pluralMatch[1];
          const body = pluralMatch[2];
          const raw = vars[varName];
          const n = typeof raw === "number" ? raw : Number(raw);
          if (Number.isFinite(n)) {
            const cat = pluralCategory(language, n);
            const branches = parsePluralBranches(body);
            const chosen =
              branches.get(cat) ?? branches.get("other") ?? "";
            out += chosen.replace(/#/g, String(n));
            i += block.length;
            continue;
          }
        }
        out += block;
        i += block.length;
        continue;
      }
    }
    out += template[i];
    i++;
  }
  return out;
}

function readBalancedBlock(s: string, start: number): string | null {
  if (s[start] !== "{") return null;
  let depth = 0;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}

function parsePluralBranches(body: string): Map<string, string> {
  const result = new Map<string, string>();
  let i = 0;
  while (i < body.length) {
    while (i < body.length && /\s/.test(body[i] ?? "")) i++;
    let key = "";
    while (i < body.length && /[a-zA-Z=0-9]/.test(body[i] ?? "")) {
      key += body[i];
      i++;
    }
    while (i < body.length && /\s/.test(body[i] ?? "")) i++;
    if (body[i] !== "{") break;
    const block = readBalancedBlock(body, i);
    if (!block) break;
    const value = block.slice(1, -1);
    i += block.length;
    if (key) result.set(key, value);
  }
  return result;
}

function interpolate(
  template: string,
  language: Language,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template;
  let out = template;
  if (out.includes(", plural,")) {
    out = applyPlurals(out, language, vars);
  }
  out = out.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const v = vars[key];
    return v === undefined || v === null ? "" : String(v);
  });
  return out;
}

export function useLanguage(): Language {
  return useSettings((s) => s.settings.language);
}

export function useT(): TranslateFn {
  const language = useLanguage();
  return useMemo(() => {
    const dict = dictionaries[language] ?? dictionaries.en;
    const fallback = dictionaries.en;
    return (key: string, vars?: Record<string, string | number>) => {
      const value = lookup(dict, key) ?? lookup(fallback, key);
      if (typeof value !== "string") return key;
      return interpolate(value, language, vars);
    };
  }, [language]);
}

export function useDateLocale(): DateFnsLocale {
  const language = useLanguage();
  return dateLocales[language] ?? enLocale;
}

export function useFormatDate() {
  const locale = useDateLocale();
  return useMemo(() => {
    return (date: number | Date, fmt: string) =>
      formatDate(date, fmt, { locale });
  }, [locale]);
}

export function useFormatMoney() {
  const language = useLanguage();
  return useMemo(() => {
    return (
      amount: number,
      currency: Currency = "EUR",
      options: { compact?: boolean; sign?: boolean } = {},
    ) => formatMoneyBase(amount, currency, { ...options, language });
  }, [language]);
}

export function useFormatCompact() {
  const language = useLanguage();
  return useMemo(() => {
    return (value: number) => formatCompactBase(value, language);
  }, [language]);
}

export function useFormatPercent() {
  const language = useLanguage();
  return useMemo(() => {
    return (value: number, fractionDigits = 0) =>
      formatPercentBase(value, fractionDigits, language);
  }, [language]);
}

export function useSmartDateLabel() {
  const t = useT();
  const formatLocalized = useFormatDate();
  return useMemo(() => {
    return (date: number | Date) => {
      const target = new Date(date);
      const today = new Date();
      const dayMs = 24 * 60 * 60 * 1000;
      const startOfDay = (d: Date) => {
        const x = new Date(d);
        x.setHours(0, 0, 0, 0);
        return x;
      };
      const diff = Math.round(
        (startOfDay(target).getTime() - startOfDay(today).getTime()) / dayMs,
      );
      if (diff === 0) return t("common.today");
      if (diff === -1) return t("common.yesterday");
      if (diff > -7 && diff < 0) {
        return formatLocalized(target, "EEEE");
      }
      if (target.getFullYear() === today.getFullYear()) {
        return formatLocalized(target, "d MMM");
      }
      return formatLocalized(target, "d MMM yyyy");
    };
  }, [t, formatLocalized]);
}

export function useShortDateLabel() {
  const formatLocalized = useFormatDate();
  return useMemo(() => {
    return (date: number | Date) => {
      const target = new Date(date);
      const today = new Date();
      if (target.getFullYear() === today.getFullYear()) {
        return formatLocalized(target, "d MMM");
      }
      return formatLocalized(target, "d MMM yyyy");
    };
  }, [formatLocalized]);
}

export function useMonthLabel() {
  const formatLocalized = useFormatDate();
  return useMemo(() => {
    return (date: number | Date) => formatLocalized(date, "LLLL yyyy");
  }, [formatLocalized]);
}
