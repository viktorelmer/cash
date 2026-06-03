export type ID = string;

export type Currency = "EUR" | "USD" | "GBP" | "PLN" | "CHF" | "SEK" | "NOK" | "BYN" | "RUB";

export type ThemePreference = "system" | "light" | "dark";

export type Language = "en" | "be" | "ru";

export type RecurrenceFrequency =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "yearly";

export type IncomeType = "salary" | "investment" | "cashback" | "other";

export interface Category {
  id: ID;
  name: string;
  icon: string; // lucide icon name
  color: string; // tailwind-friendly hex
  parentId: ID | null;
  isDefault: boolean;
  createdAt: number;
  archivedAt?: number | null;
}

export interface Expense {
  id: ID;
  amount: number; // positive number, stored in main unit (e.g. 12.50)
  currency: Currency;
  categoryId: ID;
  subcategoryId: ID | null;
  tags: string[];
  note: string;
  date: number; // ms timestamp
  createdAt: number;
  updatedAt: number;
  subscriptionId?: ID | null; // if created from a recurring subscription
  presetId?: ID | null;
}

export interface Income {
  id: ID;
  amount: number;
  /** Optional bonus on top of `amount` (mainly for salary income). */
  bonusAmount?: number;
  currency: Currency;
  source: string;
  type: IncomeType;
  date: number;
  recurring: RecurrenceFrequency | null;
  taxEnabled: boolean;
  taxRate: number; // percent, e.g. 10 means 10%
  note: string;
  createdAt: number;
  updatedAt: number;
}

export interface Subscription {
  id: ID;
  name: string;
  amount: number;
  currency: Currency;
  categoryId: ID;
  frequency: RecurrenceFrequency;
  nextPaymentDate: number;
  startDate: number;
  active: boolean;
  note: string;
  color?: string;
  icon?: string;
  createdAt: number;
  updatedAt: number;
}

export type GoalKind =
  | "house"
  | "renovation"
  | "furniture"
  | "emergency"
  | "car"
  | "travel"
  | "custom";

export interface Goal {
  id: ID;
  name: string;
  kind: GoalKind;
  targetAmount: number;
  savedAmount: number;
  currency: Currency;
  deadline?: number | null; // optional ms timestamp
  monthlyContribution?: number | null;
  icon: string;
  color: string;
  note: string;
  createdAt: number;
  updatedAt: number;
}

export interface BudgetLimit {
  id: ID;
  categoryId: ID; // empty string '__total__' means whole month
  monthlyLimit: number;
  currency: Currency;
  createdAt: number;
  updatedAt: number;
}

export interface ExpensePreset {
  id: ID;
  name: string;
  amount: number;
  currency: Currency;
  categoryId: ID;
  subcategoryId: ID | null;
  icon: string;
  color?: string;
  note: string;
  createdAt: number;
}

export interface SalaryPart {
  id: ID;
  label: string; // user-facing label e.g. "First half"
  paymentDay: number; // 1-31, day of month when this part arrives
  periodMonthOffset: number; // -1 = previous month, 0 = current month
  periodStartDay: number; // 1-31
  periodEndDay: number; // 1-31, clamped to month length
  /** Fixed bonus for this payment only (not pro-rated by working days). */
  bonusAmount?: number;
}

export interface SalaryPlan {
  id: ID;
  name: string; // company / source label
  monthlyAmount: number; // gross monthly salary (base)
  /** @deprecated Legacy plan-level bonus; migrated to `parts[].bonusAmount`. */
  bonusAmount?: number;
  currency: Currency;
  taxEnabled: boolean;
  taxRate: number;
  parts: SalaryPart[]; // typically two
  note: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export type ExchangeRates = Partial<Record<Currency, number>>;

export interface AppSettings {
  id: "settings";
  currency: Currency;
  theme: ThemePreference;
  language: Language;
  defaultTaxRate: number;
  weekStartsOn: 0 | 1; // 0 sunday, 1 monday
  notificationsEnabled: boolean;
  /** Cash on hand when the user set their baseline (null = not set). */
  startingBalance: number | null;
  /** When the baseline was recorded; flows after this adjust the wallet. */
  startingBalanceAt: number | null;
  /** Foreign currency per 1 unit of `currency` (Frankfurter). */
  exchangeRates: ExchangeRates | null;
  exchangeRatesUpdatedAt: number | null;
  disclaimerAcceptedAt?: number | null;
  onboardingCompletedAt?: number | null;
}

export interface BackupBundle {
  version: 1;
  exportedAt: number;
  app: "cash";
  data: {
    expenses: Expense[];
    incomes: Income[];
    subscriptions: Subscription[];
    goals: Goal[];
    categories: Category[];
    budgets: BudgetLimit[];
    presets: ExpensePreset[];
    salaryPlans: SalaryPlan[];
    settings: AppSettings | null;
  };
}
