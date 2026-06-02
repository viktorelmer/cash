import type { Language } from "@/types";

export type { Language };

export interface LanguageOption {
  value: Language;
  label: string;
  nativeLabel: string;
}

export const LANGUAGES: LanguageOption[] = [
  { value: "en", label: "English", nativeLabel: "English" },
  { value: "be", label: "Belarusian", nativeLabel: "Беларускі" },
  { value: "ru", label: "Russian", nativeLabel: "Русский" },
];

export type TranslationVars = Record<string, string | number>;
export type TranslateFn = (key: string, vars?: TranslationVars) => string;
