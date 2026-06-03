import { create } from "zustand";
import { db, DEFAULT_SETTINGS } from "@/lib/db";
import {
  fetchExchangeRates,
  isRatesStale,
} from "@/lib/exchange";
import type {
  AppSettings,
  Currency,
  Language,
  ThemePreference,
} from "@/types";

interface SettingsState {
  settings: AppSettings;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  update: (patch: Partial<AppSettings>) => Promise<void>;
  setCurrency: (currency: Currency) => Promise<void>;
  setTheme: (theme: ThemePreference) => Promise<void>;
  setLanguage: (language: Language) => Promise<void>;
  setDefaultTaxRate: (rate: number) => Promise<void>;
  setStartingBalance: (amount: number) => Promise<void>;
  refreshExchangeRates: () => Promise<boolean>;
  refreshExchangeRatesIfStale: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  acceptDisclaimer: () => Promise<void>;
}

export const useSettings = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  hydrated: false,

  hydrate: async () => {
    const persisted = await db.settings.get("settings");
    const merged = { ...DEFAULT_SETTINGS, ...(persisted ?? {}) };
    set({
      settings: merged,
      hydrated: true,
    });
  },

  update: async (patch) => {
    const merged = { ...get().settings, ...patch, id: "settings" as const };
    await db.settings.put(merged);
    set({ settings: merged });
  },

  setCurrency: async (currency) => {
    await get().update({ currency });
    await get().refreshExchangeRates();
  },

  refreshExchangeRates: async () => {
    const base = get().settings.currency;
    try {
      const rates = await fetchExchangeRates(base);
      await get().update({
        exchangeRates: rates,
        exchangeRatesUpdatedAt: Date.now(),
      });
      return true;
    } catch (err) {
      console.error("Failed to refresh exchange rates", err);
      return false;
    }
  },

  refreshExchangeRatesIfStale: async () => {
    if (isRatesStale(get().settings.exchangeRatesUpdatedAt)) {
      await get().refreshExchangeRates();
    }
  },
  setTheme: async (theme) => {
    await get().update({ theme });
  },
  setLanguage: async (language) => {
    await get().update({ language });
  },
  setDefaultTaxRate: async (rate) => {
    await get().update({ defaultTaxRate: rate });
  },
  setStartingBalance: async (amount) => {
    const now = Date.now();
    await get().update({
      startingBalance: amount,
      startingBalanceAt: now,
      onboardingCompletedAt:
        get().settings.onboardingCompletedAt ?? now,
    });
  },

  completeOnboarding: async () => {
    const now = Date.now();
    const { startingBalanceAt, startingBalance } = get().settings;
    await get().update({
      onboardingCompletedAt: now,
      ...(startingBalanceAt === null
        ? {
            startingBalance: startingBalance ?? 0,
            startingBalanceAt: now,
          }
        : {}),
    });
  },

  acceptDisclaimer: async () => {
    await get().update({ disclaimerAcceptedAt: Date.now() });
  },
}));
